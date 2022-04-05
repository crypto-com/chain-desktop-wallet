/* eslint-disable @typescript-eslint/no-unused-vars*/
import axios, { AxiosResponse } from 'axios';
import { CRC20MainnetTokenInfos } from '../../config/CRC20Tokens';
import { EVMClient } from '../rpc/clients/EVMClient';
import { IEthChainIndexAPI, txQueryBaseParams } from '../rpc/interface/eth.chainIndex';
import { TransactionData, TransactionsByAddressResponse } from '../rpc/models/eth.models';
import {
  ICronosChainIndexAPI,
  txListRequestOptions,
  queryPaginationOptions,
  tokenTransfersRequestOptions,
} from '../rpc/interface/cronos.chainIndex';
import {
  TxListAPIResponse,
  txListByAccountRequestParams,
  PendingTxListAPIResponse,
  ContractDataResponse,
  tokenContractDataRequestParams,
  TokenTransferEventLogsResponse,
  tokenTransfersRequestParams,
  tokensOwnedByAddressRequestParams,
  TokensOwnedByAddressResponse,
} from '../rpc/models/cronos.models';

/**
 * name: EthClient
 * Uses: Crypto.com Chain Indexing APIs
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

  getTxsByAddress = async (
    address: string,
    options?: txQueryBaseParams,
  ) => {

    // Pagination params
    let currentPage = options?.page || 0;
    const limit = options?.pageSize || 1000;

    // Result
    let finalList: TransactionData[] = [];

    while (true) {
      // eslint-disable-next-line
      const txDataList = await this._getTxsByAddressPaginated(address, {
        pageSize: limit,
        page: currentPage,
      });

      // Append TxData list to the final response array
      finalList.push(...txDataList);

      // Increment pagination params
      currentPage += 1;

      if (txDataList.length < 1) {
        // If the list is empty
        break;
      }
    }

    return finalList;
  };

  private _getTxsByAddressPaginated = async (address: string, options?: txQueryBaseParams) => {
    const txListResponse: AxiosResponse<TransactionsByAddressResponse> = await axios({
      baseURL: this.indexingBaseUrl,
      url: `/address/${address}/transaction-history`,
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
