/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosResponse } from 'axios';
import { CRC20MainnetTokenInfos } from '../../config/CRC20Tokens';
import { EVMClient } from '../rpc/clients/EVMClient';
import { IEthChainIndexAPI, txQueryBaseParams } from '../rpc/interface/eth.chainIndex';
import { AddressTxDetails, BlockchairTxQueryResponse, TxData, TxDataSuccessResponse } from '../rpc/models/eth.models';
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
 * Uses: Blockchair open APIs
 * purpose: This client is used to consume data from an indexing service.
 */
export class EthClient extends EVMClient implements IEthChainIndexAPI {
  private indexingServiceBaseUrl: string;

  constructor(web3ProviderURL: string, indexingUrl: string) {
    super(EVMClient.create(web3ProviderURL).getWeb3());
    if (this.isValidHTTPURL(indexingUrl)) {
      this.indexingServiceBaseUrl = indexingUrl;
    } else {
      throw new Error('Invalid `explorerAPIBaseURL` provided.');
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
    let offset = options?.offset || 0;
    const limit = options?.limit || 10000;

    // Result
    let finalList: Array<TxData> = [];

    while (true) {
      const txDataList = await this._getTxsByAddressPaginated(address, {
        limit,
        offset,
        state: "latest",
      });

      // Append TxData list to the final response array
      finalList.push(...txDataList);

      // Increment pagination params
      offset += 1;

      if (txDataList.length < 1) {
        break;
      }
    }

    return finalList;
  };

  private _getTxsByAddressPaginated = async (address: string, options?: txQueryBaseParams) => {
    const txListResponse: AxiosResponse<BlockchairTxQueryResponse> = await axios({
      baseURL: this.indexingServiceBaseUrl,
      url: `/address/${address}`,
      params: { ...options },
    });

    if (txListResponse.status !== 200) {
      return [];
    }

    if (!txListResponse.data.data) {
      return [];
    }

    return txListResponse.data.data[address.toLowerCase()].calls as TxData[];
  };

  getTxByHash(txHash: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getInternalTxsByAddress(address: string, options?: any) {
    throw new Error('Method not implemented.');
  }
}
