import { TxListAPIResponse } from "../models/cronos.models";

// Reference: https://cronos-explorer.crypto.org/api-docs

export interface ICronosChainIndexAPI {
  // Transaction
  getTxsByAddress(address: string): Promise<TxListAPIResponse>;
  getPendingTxsByAddress(address: string): Promise<TxListAPIResponse>;

  // Todo: 
  // - Internal Transactions
  // - Token transfers
  // - Multi-balance by Address
}

