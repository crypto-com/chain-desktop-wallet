/**
 * Crypto.com Indexing API Response Models
 */

export interface BalancesByAddressResponse {
  data: BalanceData;
}

export interface BalanceData {
  address: string;
  assets: {
    token_addr: string;
    token_name: string;
    token_symbol: string;
    decimals: number;
    balance: number;
  }[];
}

export interface TransactionsByAddressResponse {
  data: TransactionData[];
}

export interface TransactionData {
  block_hash: string;
  block_number: number;
  call_error: string;
  contract_creation: boolean;
  from: string;
  from_metadata: {
    is_contract: boolean;
  }
  gas_limit: number;
  gas_price: string;
  gas_used: number;
  hash: string;
  index: number;
  method_id: string;
  method_name: string;
  nonce: number;
  status: number;
  timestamp: number;
  to: string;
  to_metadata: {
    is_contract: boolean;
  }
  type: number;
  value: string;
  decimal?: number;
  fail_reason?: null;
  failed?: boolean;
  log_index?: number;
  signer?: string[];
  token_addr?: string;
  token_name?: string;
  token_symbol?: string;
}
