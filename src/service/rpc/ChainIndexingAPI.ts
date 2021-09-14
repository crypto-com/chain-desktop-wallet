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
  accountMsgList,
  ValidatorListResponse,
  AccountInfoResponse,
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
   * Gets estimated CRO rewards for a useraddress
   * @param userAddress 
   * @param validatorAddress 
   * @param futureDurationInSec
   @returns {string} Estimated rewards in baseunit 
  */
  public async getFutureEstimatedRewardsByValidatorAddress(
    validatorAddress: string,
    durationInSeconds: number,
    userAddress: string,
  ) {
    const [validatorInfo, bondedBalanceInString] = await Promise.all([
      this.getValidatorDetails(validatorAddress),
      this.getTotalBondedBalanceByUserAddress(userAddress),
    ]);

    if (!validatorInfo) {
      throw new Error('Cannot fetch validator information.');
    }

    const apyRate = validatorInfo.apy; // already fetched as divided by 100

    // 1 year = 31536000 sec
    const timeInYrs = new Big(durationInSeconds).div(new Big('31536000'));

    /**
     Note: 
     - Commission rate is not deducted
     - Compound frequency not considered.
     - Considering APY as simple interest rate.
     - Current Formula: Final Balance = Principal * (1 + (rate/100) * timeInYrs)
     */
    const estimatedRewards = new Big(bondedBalanceInString).mul(
      new Big(1).add(new Big(apyRate).mul(timeInYrs)),
    );
    return {
      estimatedRewards: estimatedRewards.toFixed(18),
      estimatedApy: apyRate,
    };
  }

  private async getTotalBondedBalanceByUserAddress(userAddress: string) {
    const accountInfo = await this.axiosClient.get<AccountInfoResponse>(`accounts/${userAddress}`);

    let totalBondedBalance = new Big(0);

    // Calculate total bonded balance
    accountInfo.data.result.bondedBalance.forEach(amount => {
      totalBondedBalance = totalBondedBalance.add(amount.amount);
    });

    // Total bonded balance
    return totalBondedBalance.toString();
  }

  private async getValidatorDetails(validatorAddr: string) {
    const validatorList = await this.axiosClient.get<ValidatorListResponse>(
      `validators?limit=1000000`,
    );

    if (validatorList.data.pagination.total_page > 1) {
      throw new Error('Validator list is very big. Aborting.');
    }

    // Check if returned list is empty
    if (validatorList.data.result.length < 1) {
      return undefined;
    }

    const listedValidatorInfo = validatorList.data.result.find(
      validatorInfo => validatorInfo.operatorAddress === validatorAddr,
    );

    // Listed ValidatorInfo
    return listedValidatorInfo;
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
        if (msg.messageType === 'MsgWithdrawDelegatorReward') {
          // Check recipient and delegator
          if (msg.data.delegatorAddress === msg.data.recipientAddress) {
            // Process non-empty msg `amount` list
            msg.data.amount.forEach(amount => {
              totalClaims = totalClaims.add(new Big(amount.amount));
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
