import axios, { AxiosInstance } from 'axios';
import Big from 'big.js';
import {
  NftAccountTransactionListResponse,
  NftDenomResponse,
  NftListResponse,
  NftResponse,
  NftTransactionListResponse,
  NftTransactionResponse,
  TransferDataAmount,
  TransferListResponse,
  TransferResult,
  AccountMessagesListResponse,
} from './ChainIndexingModels';
import {
  NftQueryParams,
  TransactionStatus,
  TransferTransactionData,
  NftModel,
} from '../../models/Transaction';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import { croNftApi, MintByCDCRequest } from './NftApi';
import { splitToChunks } from '../../utils/utils';
import { UserAsset } from '../../models/UserAsset';
import { accountMsgList } from './ChainIndexingModels';

export interface IChainIndexingAPI {
  fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
  ): Promise<Array<TransferTransactionData>>;
}

export class ChainIndexingAPI implements IChainIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init(baseUrl: string) {
    const defaultIndexingUrl = DefaultWalletConfigs.TestNetConfig.indexingUrl;
    const chainIndexBaseUrl = !baseUrl ? defaultIndexingUrl : baseUrl;
    const axiosClient = axios.create({
      baseURL: chainIndexBaseUrl,
    });
    return new ChainIndexingAPI(axiosClient);
  }

  public async getAccountNFTList(account: string): Promise<NftResponse[]> {
    let paginationPage = 1;
    const nftsListRequest = await this.axiosClient.get<NftListResponse>(
      `/nfts/accounts/${account}/tokens?page=${paginationPage}`,
    );
    const nftsListResponse: NftListResponse = nftsListRequest.data;

    let { pagination } = nftsListResponse;

    const nftLists = nftsListResponse.result;

    while (pagination.total_page > pagination.current_page) {
      paginationPage += 1;
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftListResponse>(
        `/nfts/accounts/${account}/tokens?page=${paginationPage}`,
      );
      const pageNftsListResponse: NftListResponse = pageNftsListRequest.data;

      pagination = pageNftsListResponse.pagination;
      nftLists.push(...pageNftsListResponse.result);
    }

    return nftLists;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getNftListMarketplaceData(nftLists: NftResponse[]): Promise<NftModel[]> {
    const nftListMap: NftModel[] = [];
    const payload: MintByCDCRequest[] = nftLists.map(item => {
      nftListMap[`${item.denomId}-${item.tokenId}`] = {
        ...item,
        isMintedByCDC: false,
        marketplaceLink: '',
      };
      return {
        denomId: item.denomId,
        tokenIds: [item.tokenId],
      };
    });

    const payloadChunks = splitToChunks(payload, 10);

    try {
      const results = await Promise.all(
        payloadChunks.map(async chunks => {
          return await croNftApi.getNftListMarketplaceData(chunks);
        }),
      );

      results.forEach(result => {
        result.forEach(item => {
          nftListMap[`${item.denomId}-${item.tokenId}`] = {
            ...nftListMap[`${item.denomId}-${item.tokenId}`],
            isMintedByCDC: item.isMinted,
            marketplaceLink: item.link ? item.link : '',
          };
        });
      });
      return Object.values(nftListMap);
    } catch (e) {
      return Object.values(nftListMap);
    }
  }

  public async getNFTTransferHistory(nftQuery: NftQueryParams): Promise<NftTransactionResponse[]> {
    let paginationPage = 1;
    const { denomId, tokenId } = nftQuery;
    const nftsTxListRequest = await this.axiosClient.get<NftTransactionListResponse>(
      `/nfts/denoms/${denomId}/tokens/${tokenId}/transfers`,
    );

    const nftTxListResponse: NftTransactionListResponse = nftsTxListRequest.data;
    let { pagination } = nftTxListResponse;

    const nftTxLists = nftTxListResponse.result;

    while (pagination.total_page > pagination.current_page) {
      paginationPage += 1;
      // eslint-disable-next-line no-await-in-loop
      const pageNftTxListRequest = await this.axiosClient.get<NftTransactionListResponse>(
        `/nfts/denoms/${denomId}/tokens/${tokenId}/transfers?page=${paginationPage}`,
      );
      const pageNftTxListResponse: NftTransactionListResponse = pageNftTxListRequest.data;
      pagination = pageNftTxListResponse.pagination;

      nftTxLists.push(...pageNftTxListResponse.result);
    }

    return nftTxLists;
  }

  public async fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
    asset?: UserAsset,
  ): Promise<Array<TransferTransactionData>> {
    const transferListResponse = await this.axiosClient.get<TransferListResponse>(
      `/accounts/${address}/messages?order=height.desc&filter.msgType=MsgSend`,
    );

    function getStatus(transfer: TransferResult) {
      if (transfer.success) {
        return TransactionStatus.SUCCESS;
      }
      return TransactionStatus.FAILED;
    }

    const { data } = transferListResponse;

    function getTransferAmount(transfer): TransferDataAmount | null {
      return transfer.data.amount.filter(amount => amount.denom === baseAssetSymbol)[0];
    }

    try {
      return data.result
        .filter(trx => {
          const transferAmount = getTransferAmount(trx);
          return transferAmount !== undefined && transferAmount !== null;
        })
        .map(transfer => {
          const assetAmount = getTransferAmount(transfer);
          const transferData: TransferTransactionData = {
            amount: assetAmount?.amount ?? '0',
            assetSymbol: asset?.symbol || baseAssetSymbol,
            date: transfer.blockTime,
            hash: transfer.transactionHash,
            memo: '',
            receiverAddress: transfer.data.toAddress,
            senderAddress: transfer.data.fromAddress,
            status: getStatus(transfer),
          };

          return transferData;
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_TRANSFERS', { data, baseAssetSymbol, address });
      return [];
    }
  }

  public async fetchAllAccountNFTsTransactions(
    address: string,
  ): Promise<NftAccountTransactionListResponse> {
    try {
      const nftTxsListResponse = await this.axiosClient.get<NftAccountTransactionListResponse>(
        `accounts/${address}/messages?order=height.desc&filter.msgType=MsgTransferNFT,MsgMintNFT,MsgIssueDenom`,
      );
      return nftTxsListResponse.data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_NFT_ACCOUNT_TXs', e);
      return {
        result: [],
      };
    }
  }

  public async fetchNftDenomData(denomId: string): Promise<NftDenomResponse> {
    try {
      const denomIdInfo = await this.axiosClient.get<NftDenomResponse>(`nfts/denoms/${denomId}`);
      return denomIdInfo.data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_NFT_DENOM_INFO', e);
      return {
        result: null,
      };
    }
  }

  /**
   * Get total rewards for an active account on CRO (Cosmos SDK) chain
   * @param address
   */
  public async getTotalRewardsClaimedByAddress(address: string) {
    try {
      const rewardMsgList = await this.getDelegatorRewardMessageList(address);

      let totalClaims = new Big(0);

      rewardMsgList.forEach(msg => {

        // Only process this MSG type
        if (msg.messageType === "MsgWithdrawDelegatorReward") {

          // Check recipient and delegator
          if (msg.data.delegatorAddress === msg.data.recipientAddress) {

            // Process non-empty msg `amount` list
            msg.data.amount.forEach(amount => {
              totalClaims = totalClaims.add(new Big(amount.amount))
            });
          }
        }
      });

      // TotalRewardsClaimed in string
      return totalClaims.toString();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_CALCULATING_TOTAL_REWARDS', e);
      return '0';
    }
  }

  private async getDelegatorRewardMessageList(address: string) {

    let currentPage = 1;
    let totalPages = 1;
    const finalMsgList: accountMsgList[] = [];

    while (currentPage <= totalPages) {

      // eslint-disable-next-line no-await-in-loop
      const delegatorRewardMessageList = await this.axiosClient.get<AccountMessagesListResponse>(
        `accounts/${address}/messages?order=height.desc&filter.msgType=MsgWithdrawDelegatorReward&page=${currentPage}`,
      );

      totalPages = delegatorRewardMessageList.data.pagination.total_page;
      currentPage += 1;

      // Check if returned list is empty
      if (delegatorRewardMessageList.data.result.length < 1) {
        return finalMsgList;
      }

      // Process incoming list to sum total claimed rewards
      finalMsgList.push(...delegatorRewardMessageList.data.result);
    }

    return finalMsgList;
  }
}
