import { TxListAPIResponse, PendingTxListAPIResponse } from '../models/cronos.models';

// Reference: https://cronos.crypto.org/explorer/api-docs

export interface txListRequestOptions extends txPendingListRequestOptions {
  sort?: 'desc' | 'asc' | undefined;
  startblock?: number | undefined;
  endblock?: number | undefined;
  filterby?: string | undefined;
  starttimestamp?: number | undefined;
  unixendtimestamp?: number | undefined;
}

export interface txPendingListRequestOptions {
  page?: string | undefined;
  offset?: string | undefined;
}

export interface ICronosChainIndexAPI {
  // Transaction
  getTxsByAddress(address: string, options?: txListRequestOptions): Promise<TxListAPIResponse>;
  getPendingTxsByAddress(
    address: string,
    options?: txPendingListRequestOptions,
  ): Promise<PendingTxListAPIResponse>;

  // Todo:
  // - Internal Transactions
  // - Token transfers
  // - Multi-balance by Address
}
