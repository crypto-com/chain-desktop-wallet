import axios, { AxiosResponse } from 'axios';
import { EVMClient } from '../rpc/clients/EVMClient';
import {
  balanceQueryBaseParams,
  IEthChainIndexAPI,
  txQueryBaseParams,
} from '../rpc/interface/eth.chainIndex';
import {
  BalancesByAddressResponse,
  TransactionData,
  TransactionsByAddressResponse,
} from '../rpc/models/eth.models';

/**
 * name: EthClient
 * Uses: Ethereum Chain Indexing APIs
 * purpose: This client is used to consume data from an indexing service.
 */
export class EthClient extends EVMClient implements IEthChainIndexAPI {
  private indexingBaseUrl: string;

  constructor(web3ProviderURL: string, indexingUrl: string) {
    super(EVMClient.create(web3ProviderURL).getWeb3());
    if (this.isValidHTTPURL(indexingUrl)) {
      this.indexingBaseUrl = indexingUrl;
    } else {
      throw new Error('Invalid `indexingUrl` provided.');
    }
  }

  private isValidHTTPURL = (url: string): boolean => {
    if (url.startsWith('https://')) {
      return true;
    }
    if (url.startsWith('http://')) {
      return true;
    }
    return false;
  };

  getETHBalanceByAddress = async (address: string): Promise<string> => {
    const balanceResponse: AxiosResponse<BalancesByAddressResponse> = await axios({
      baseURL: this.indexingBaseUrl,
      url: `/address/${address.toLowerCase()}/balance`,
    });

    if (balanceResponse.status !== 200) {
      return '0';
    }

    if (!balanceResponse.data.data) {
      return '0';
    }

    const ethBalance = balanceResponse.data.data.assets
      .find(asset => asset.token_addr === 'ETH')
      ?.balance.toString();

    return ethBalance ?? '0';
  };

  getBalanceByAddress = async (address: string, options?: balanceQueryBaseParams) => {
    const balanceResponse: AxiosResponse<BalancesByAddressResponse> = await axios({
      baseURL: this.indexingBaseUrl,
      url: `/address/${address.toLowerCase()}/balance`,
      params: { ...options },
    });

    if (balanceResponse.status !== 200) {
      return [];
    }

    if (!balanceResponse.data.data) {
      return [];
    }

    return balanceResponse.data.data.assets;
  };

  getTxsByAddress = async (address: string, options?: txQueryBaseParams) => {
    // Pagination params
    let currentPage = options?.page || 0;
    const limit = options?.pageSize || 100;

    // Result
    const finalList: TransactionData[] = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line
      const txDataList = await this.getTxsByAddressPaginated(address, {
        pageSize: limit,
        page: currentPage,
        sort: 'timestamp:desc',
      });

      // Append TxData list to the final response array
      finalList.push(...txDataList);

      // Increment pagination params
      currentPage += 1;

      if (txDataList.length < 1 || txDataList.length < limit) {
        break;
      }
    }

    return finalList;
  };

  private getTxsByAddressPaginated = async (address: string, options?: txQueryBaseParams) => {
    const txListResponse: AxiosResponse<TransactionsByAddressResponse> = await axios({
      baseURL: this.indexingBaseUrl,
      url: `/address/${address.toLowerCase()}/normal`,
      params: { ...options },
    });

    if (txListResponse.status !== 200) {
      return [];
    }

    if (!txListResponse.data.data) {
      return [];
    }

    return txListResponse.data.data as TransactionData[];
  };

  // eslint-disable-next-line
  getTxByHash(txHash: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  // eslint-disable-next-line
  getInternalTxsByAddress(address: string, options?: any) {
    throw new Error('Method not implemented.');
  }
}
