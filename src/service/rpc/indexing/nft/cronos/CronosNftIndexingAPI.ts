import axios, { AxiosInstance } from 'axios';
import {
  NftAssetsResponse,
  NftAssetsResponseAssetModel,
  NftTxsResponse,
  NftTxsResponseTxModel,
} from './CronosNftIndexingModels';
import { NCW_NFT_MIDDLEWARE_SERVER_ENDPOINT } from '../../../../../config/StaticConfig';

export class CronosNftIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init() {
    const defaultIndexingUrl = NCW_NFT_MIDDLEWARE_SERVER_ENDPOINT;
    const axiosClient = axios.create({
      baseURL: defaultIndexingUrl,
    });
    return new CronosNftIndexingAPI(axiosClient);
  }

  public async getNftList(address: string) {
    const nftList: NftAssetsResponseAssetModel[] = [];
    let paginationPage = 1;
    const nftAssetsRequest = await this.axiosClient.get<NftAssetsResponse>(
      `/assets/${address}?chain=cronos&limit=10&offset=0`,
    );
    const response: NftAssetsResponse = nftAssetsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftList.push(...response.data.nft_assets);

    let assetsResponse: NftAssetsResponse = response;

    while (assetsResponse.data.nft_assets.length >= 10) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftAssetsResponse>(
        `/assets/${address}?chain=cronos&limit=10&offset=${paginationPage * 10}`,
      );
      assetsResponse = pageNftsListRequest.data;
      paginationPage++;
      if (assetsResponse.code === 0) {
        nftList.push(...assetsResponse.data.nft_assets);
      }
    }

    return nftList;
  }

  public async getNftTxsList(address: string) {
    const nftTxsList: NftTxsResponseTxModel[] = [];
    let paginationPage = 1;
    const nftTxsRequest = await this.axiosClient.get<NftTxsResponse>(
      `/txs/${address}?chain=cronos&limit=10&offset=0`,
    );
    const response: NftTxsResponse = nftTxsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftTxsList.push(...response.data.nft_txs);

    let txsResponse: NftTxsResponse = response;

    while (txsResponse.data.nft_txs.length >= 10) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftTxsResponse>(
        `/txs/${address}?chain=cronos&limit=10&offset=${paginationPage * 10}`,
      );
      txsResponse = pageNftsListRequest.data;
      paginationPage++;
      if (txsResponse.code === 0) {
        nftTxsList.push(...txsResponse.data.nft_txs);
      }
    }

    return nftTxsList;
  }
}
