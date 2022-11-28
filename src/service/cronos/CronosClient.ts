/* eslint-disable @typescript-eslint/no-unused-vars */
import axios, { AxiosResponse } from 'axios';
import { Log } from '@ethersproject/abstract-provider';
import { CRC20MainnetTokenInfos } from '../../config/CRC20Tokens';
import { EVMClient } from '../rpc/clients/EVMClient';
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
  EventLogResponse,
  ContractSourceCodeResponse,
  TokenBalanceResponse,
} from '../rpc/models/cronos.models';
import {
  ICronosChainIndexAPI,
  txListRequestOptions,
  queryPaginationOptions,
  tokenTransfersRequestOptions,
} from '../rpc/interface/cronos.chainIndex';
import { ICON_CRO_EVM } from '../../components/AssetIcon';

/**
 * name: CronosClient
 * purpose: This client can be used to handle `Cronos` related operations.
 */
export class CronosClient extends EVMClient implements ICronosChainIndexAPI {
  private cronosExplorerAPIBaseURL: string;

  constructor(web3ProviderURL: string, explorerAPIBaseURL: string) {
    super(EVMClient.create(web3ProviderURL).getWeb3());
    if (this.isValidHTTPURL(explorerAPIBaseURL)) {
      this.cronosExplorerAPIBaseURL = explorerAPIBaseURL;
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
    options?: txListRequestOptions,
  ): Promise<TxListAPIResponse> => {
    const requestParams: txListByAccountRequestParams = {
      module: 'account',
      action: 'txlist',
      address,
      ...options,
    };

    const txListResponse: AxiosResponse<TxListAPIResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch transaction list from Cronos Chain Index API.');
    }
    return txListResponse.data;
  };

  getPendingTxsByAddress = async (
    address: string,
    options?: queryPaginationOptions,
  ): Promise<PendingTxListAPIResponse> => {
    const requestParams: txListByAccountRequestParams = {
      module: 'account',
      action: 'pendingtxlist',
      address,
      ...options,
    };

    const txListResponse: AxiosResponse<PendingTxListAPIResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch pending transaction list from Cronos Chain Index API.');
    }
    return txListResponse.data;
  };

  async getTokenTransfersByAddress(
    address: string,
    options?: tokenTransfersRequestOptions,
  ): Promise<TokenTransferEventLogsResponse> {
    const requestParams: tokenTransfersRequestParams = {
      module: 'account',
      action: 'tokentx',
      address,
      ...options,
    };

    const txListResponse: AxiosResponse<TokenTransferEventLogsResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch token transfers from Cronos Chain Index API.');
    }
    return txListResponse.data;
  }

  async getTokensOwnedByAddress(address: string): Promise<TokensOwnedByAddressResponse> {
    const requestParams: tokensOwnedByAddressRequestParams = {
      module: 'account',
      action: 'tokenlist',
      address,
    };

    const txListResponse: AxiosResponse<TokensOwnedByAddressResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch token owned by user address from Cronos Chain Index API.');
    }
    return txListResponse.data;
  }

  async getContractDataByAddress(contractAddress: string): Promise<ContractDataResponse> {
    const requestParams: tokenContractDataRequestParams = {
      module: 'token',
      action: 'getToken',
      contractaddress: contractAddress,
    };

    const txListResponse: AxiosResponse<ContractDataResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (txListResponse.status !== 200) {
      throw new Error('Could not fetch from Cronos Chain Index API.');
    }
    return txListResponse.data;
  }

  async getTokenBalanceByAddress(token: string, address: string) {
    const requestParams = {
      module: 'account',
      action: 'tokenbalance',
      contractaddress: token,
      address,
    };

    const response: AxiosResponse<TokenBalanceResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (response.status !== 200) {
      throw new Error('Could not fetch from Cronos Chain Index API.');
    }
    return response.data;
  }

  async getContractSourceCodeByAddress(address: string) {
    const requestParams = {
      module: 'contract',
      action: 'getsourcecode',
      address,
    };

    const response: AxiosResponse<ContractSourceCodeResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (response.status !== 200) {
      throw new Error('Could not fetch from Cronos Chain Index API.');
    }
    return response.data;
  }

  static getTokenIconUrlBySymbol(symbol: string): string {
    if (symbol === 'WCRO') return ICON_CRO_EVM;

    const tokenInfo = CRC20MainnetTokenInfos.get(symbol.toUpperCase());

    return tokenInfo?.iconURL ?? '';
  }

  async getEventLogByAddress(args: {
    fromBlock: number;
    toBlock: number | 'latest';
    address?: string;
    topics?: Object;
  }): Promise<Log[]> {
    const requestParams = {
      module: 'logs',
      action: 'getLogs',
      fromBlock: args.fromBlock,
      toBlock: args.toBlock,
      address: args.address,
      ...args.topics,
    };

    const response: AxiosResponse<EventLogResponse> = await axios({
      baseURL: this.cronosExplorerAPIBaseURL,
      url: '',
      params: requestParams,
    });

    if (response.status !== 200) {
      throw new Error('Could not fetch token owned by user address from Cronos Chain Index API.');
    }
    return response.data.result;
  }
}
