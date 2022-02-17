import {
  TxListAPIResponse,
  PendingTxListAPIResponse,
  TokenTransferEventLogsResponse,
  TokensOwnedByAddressResponse,
  ContractDataResponse,
} from '../models/cronos.models';

// Reference: https://cronos.org/explorer/api-docs

export interface txListRequestOptions extends queryPaginationOptions {
  sort?: 'desc' | 'asc' | undefined;
  startblock?: number | undefined;
  endblock?: number | undefined;
  filterby?: string | undefined;
  starttimestamp?: number | undefined;
  unixendtimestamp?: number | undefined;
}

export interface tokenTransfersRequestOptions extends queryCommonOptions {
  contractaddress?: string | undefined;
}

export interface queryCommonOptions extends queryPaginationOptions {
  sort?: 'desc' | 'asc' | undefined;
  startblock?: number | undefined;
  endblock?: number | undefined;
}

export interface queryPaginationOptions {
  page?: string | undefined;
  offset?: string | undefined;
}

export interface ICronosChainIndexAPI {
  // Transaction
  getTxsByAddress(address: string, options?: txListRequestOptions): Promise<TxListAPIResponse>;
  getPendingTxsByAddress(
    address: string,
    options?: queryPaginationOptions,
  ): Promise<PendingTxListAPIResponse>;

  // - Token transfers event logs by address
  // ?module=account&action=tokentx&address={addressHash}
  getTokenTransfersByAddress(
    address: string,
    options?: tokenTransfersRequestOptions,
  ): Promise<TokenTransferEventLogsResponse>;

  // Returns a list of tokens owned by an address
  // ?module=account&action=tokenlist&address={addressHash}
  getTokensOwnedByAddress(address: string): Promise<TokensOwnedByAddressResponse>;

  // Get ERC-20 or ERC-721 token by contract address.
  // ?module=token&action=getToken&contractaddress={contractAddressHash}
  getContractDataByAddress(contractAddress: string): Promise<ContractDataResponse>;

  // Todo:
  // - Internal Transactions
  // - Multi-balance by Address
}

export enum SupportedCRCTokenStandard {
  CRC_20_TOKEN = 'ERC-20',
  CRC_721_TOKEN = 'ERC-721',
}
