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

  private static get pageLimit() {
    return 100;
  }

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

    // Deprecated NCW Blockchain API
    // const nftAssetsRequest = await this.axiosClient.get<NftAssetsResponse>(
    //   `/quantra/v1/nft/assets/${address}?chain=cronos&limit=${CronosNftIndexingAPI.pageLimit}&offset=0`,
    // );
    // nftList.push(...response.data.nft_assets);

    // NCW NFT API
    const nftAssetsRequest = await this.axiosClient.get<NftAssetsResponse>(
      `/nft/api/v1/inner/assets?protocol=cronos&page_size=${CronosNftIndexingAPI.pageLimit}&offset=0&wallet_address=${address.toLowerCase()}`,
    );

    const response: NftAssetsResponse = nftAssetsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftList.push(...response.data);

    let assetsResponse: NftAssetsResponse = response;

    while (assetsResponse.data.length >= CronosNftIndexingAPI.pageLimit) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftAssetsResponse>(
        `/nft/api/v1/inner/assets?protocol=cronos&wallet_address=${address.toLowerCase()}&page_size=${
          CronosNftIndexingAPI.pageLimit
        }&offset=${paginationPage * CronosNftIndexingAPI.pageLimit}`,
      );
      assetsResponse = pageNftsListRequest.data;
      paginationPage++;
      if (assetsResponse.code === 0) {
        nftList.push(...assetsResponse.data);
      }
    }

    return nftList;
  }

  public async getNftTxsList(address: string) {
    const nftTxsList: NftTxsResponseTxModel[] = [];
    let paginationPage = 1;
    const nftTxsRequest = await this.axiosClient.get<NftTxsResponse>(
      `/quantra/v1/nft/txs/${address}?chain=cronos&limit=${CronosNftIndexingAPI.pageLimit}&offset=0`,
    );
    const response: NftTxsResponse = nftTxsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftTxsList.push(...response.data.nft_txs.filter(tx => tx.event_type === 'Transfer'));

    let txsResponse: NftTxsResponse = response;

    while (txsResponse.data.nft_txs.length >= CronosNftIndexingAPI.pageLimit) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftTxsResponse>(
        `/quantra/v1/nft/txs/${address}?chain=cronos&limit=${
          CronosNftIndexingAPI.pageLimit
        }&offset=${paginationPage * CronosNftIndexingAPI.pageLimit}`,
      );
      txsResponse = pageNftsListRequest.data;
      paginationPage++;
      if (txsResponse.code === 0) {
        nftTxsList.push(...txsResponse.data.nft_txs.filter(tx => tx.event_type === 'Transfer'));
      }
    }

    return nftTxsList;
  }
}
