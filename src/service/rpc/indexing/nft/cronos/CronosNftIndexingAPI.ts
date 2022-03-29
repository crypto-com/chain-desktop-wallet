import axios, { AxiosInstance } from 'axios';
import { nftAssetsResponse, nftAssetsResponseAssetModel } from './CronosNftIndexingModels';

export class CronosNftIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init() {
    const defaultIndexingUrl = 'https://asta-ncw-blockchain-api.3ona.co/quantra/v1/nft';
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

    console.log(`getNftList response`, response);
    if (response.code !== 0) {
      return [];
    }

    nftList.push(...response.data.nft_assets);
    console.log(`nftList`, nftList);

    let nftAssetsResponseData = response.data;

    while (nftAssetsResponseData.nft_assets.length === 10) {
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListResponse: nftAssetsResponse = await this.axiosClient.get(
        `/assets/${address}?chain=cronos&limit=10&offset=${paginationPage * 10}`,
      );
      nftAssetsResponseData = pageNftsListResponse.data;
      paginationPage++;
      if (pageNftsListResponse.code === 0 && nftAssetsResponseData.nft_assets.length > 0) {
        nftList.push(...nftAssetsResponseData.nft_assets);
      }
    }

    return nftList;
  }
}
