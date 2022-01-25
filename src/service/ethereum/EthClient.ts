/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosResponse } from 'axios';
import { CRC20MainnetTokenInfos } from '../../config/CRC20Tokens';
import { EVMClient } from '../rpc/clients/EVMClient';
import { IEthChainIndexAPI, txQueryBaseParams } from '../rpc/interface/eth.chainIndex';
import { BlockchairTxQueryResponse, TxDataSuccessResponse } from '../rpc/models/eth.models';
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
    const requestParams = {
      ...options,
    };

    const txListResponse: AxiosResponse<BlockchairTxQueryResponse> = await axios({
      baseURL: this.indexingServiceBaseUrl,
      url: `/address/${address}`,
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch transaction list from Blockchair Indexing API.');
    }
    return txListResponse.data as TxDataSuccessResponse;
  };

  getTxByHash(txHash: string): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getInternalTxsByAddress(address: string, options?: any) {
    throw new Error('Method not implemented.');
  }
}
