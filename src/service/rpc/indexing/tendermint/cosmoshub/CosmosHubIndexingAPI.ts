import axios, { AxiosInstance } from 'axios';
import { CosmosHubTxsResponse, CosmosHubTxsResponseTxModel } from './CosmosHubIndexingModels';

export class CosmosHubIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private static get pageLimit() {
    return 1000;
  }

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init(indexingUrl: string) {
    const defaultIndexingUrl = indexingUrl;
    const axiosClient = axios.create({
      baseURL: defaultIndexingUrl,
    });
    return new CosmosHubIndexingAPI(axiosClient);
  }

  public async getCosmosHubTxList(address: string) {
    const txList: CosmosHubTxsResponseTxModel[] = [];
    const filterTxType = ['send'];
    let paginationPage = 1;
    const txListRequest = await this.axiosClient.get<CosmosHubTxsResponse>(
      `/cosmos/txs?wallet_address=${address}&limit=${CosmosHubIndexingAPI.pageLimit}&offset=0`,
    );
    const response: CosmosHubTxsResponse = txListRequest.data;

    if (response.code !== 0 || response.data.length === 0) {
      return [];
    }

    txList.push(...response.data.filter(tx => filterTxType.includes(tx.type)));

    let txResponse: CosmosHubTxsResponse = response;

    while (txResponse.data.length > 0) {
      // eslint-disable-next-line no-await-in-loop
      const pageTxListRequest = await this.axiosClient.get<CosmosHubTxsResponse>(
        `/cosmos/txs?wallet_address=${address}&limit=${
          CosmosHubIndexingAPI.pageLimit
        }&offset=${paginationPage * CosmosHubIndexingAPI.pageLimit}`,
      );
      txResponse = pageTxListRequest.data;
      paginationPage++;
      if (txResponse.code === 0) {
        txList.push(...txResponse.data.filter(tx => filterTxType.includes(tx.type)));
      }
    }

    return txList;
  }
}
