import axios, { AxiosInstance } from 'axios';
import {
  nftAssetsResponse,
  nftAssetsResponseAssetModel,
  nftTxsResponse,
  nftTxsResponseTxModel,
} from './CronosNftIndexingModels';

export class CronosNftIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init() {
    const defaultIndexingUrl =
      'https://cronos.org/ncw-quandra-api-middleware-server/quantra/v1/nft';
    const axiosClient = axios.create({
      baseURL: defaultIndexingUrl,
    });
    return new CronosNftIndexingAPI(axiosClient);
  }

  public async getNftList(address: string) {
    const nftList: nftAssetsResponseAssetModel[] = [];
    let paginationPage = 1;
    const nftAssetsRequest = await this.axiosClient.get<nftAssetsResponse>(
      `/assets/${address}?chain=cronos&limit=10&offset=0`,
    );
    const response: nftAssetsResponse = nftAssetsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftList.push(...response.data.nft_assets);

    let assetsResponse: nftAssetsResponse = response;

    while (assetsResponse.data.nft_assets.length >= 10) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<nftAssetsResponse>(
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
    const nftTxsList: nftTxsResponseTxModel[] = [];
    let paginationPage = 1;
    const nftTxsRequest = await this.axiosClient.get<nftTxsResponse>(
      `/txs/${address}?chain=cronos&limit=10&offset=0`,
    );
    const response: nftTxsResponse = nftTxsRequest.data;

    if (response.code !== 0) {
      return [];
    }

    nftTxsList.push(...response.data.nft_txs);

    let txsResponse: nftTxsResponse = response;

    while (txsResponse.data.nft_txs.length >= 10) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<nftTxsResponse>(
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
