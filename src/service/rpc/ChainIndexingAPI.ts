import axios, { AxiosInstance } from 'axios';
import {
  NftListResponse,
  NftResponse,
  NftTransactionListResponse,
  NftTransactionResponse,
  TransferDataAmount,
  TransferListResponse,
  TransferResult,
} from './ChainIndexingModels';
import {
  NFTQueryParams,
  TransactionStatus,
  TransferTransactionData,
  NftModel,
} from '../../models/Transaction';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import { croNftApi, MintByCDCRequest } from './NftApi';

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
    const payload: MintByCDCRequest[] = nftLists.map(item => {
      return {
        denomId: item.denomId,
        tokenIds: [item.tokenId],
      };
    });
    let nftListWithMarketplaceData;

    try {
      const nftMarketplaceData = await croNftApi.getNftListMarketplaceData(payload);

      if (nftMarketplaceData.length !== 0) {
        nftListWithMarketplaceData = nftMarketplaceData.map((item, idx) => {
          return {
            ...nftLists[idx],
            isMintedByCDC: item.isMintedByCDC,
            nftMarketplaceLink: item.link ? item.link : '',
          };
        });
      } else {
        nftListWithMarketplaceData = nftLists.map((item, idx) => {
          return {
            ...nftLists[idx],
            isMintedByCDC: false,
            marketplaceLink: '',
          };
        });
      }
    } catch (e) {
      nftListWithMarketplaceData = nftLists.map((item, idx) => {
        return {
          ...nftLists[idx],
          isMintedByCDC: false,
          marketplaceLink: '',
        };
      });
    }
    return nftListWithMarketplaceData;
  }

  public async getNFTTransferHistory(nftQuery: NFTQueryParams): Promise<NftTransactionResponse[]> {
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
            assetSymbol: 'TCRO', // Hardcoded for now
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
}
