interface ExplorerAPIResponse {
  message: string;
  // "1": ok | "0" : not ok
  status: '1' | '0';
}

export interface TxListAPIResponse extends ExplorerAPIResponse {
  result: TransactionDetail[];
}

export interface PendingTxListAPIResponse extends ExplorerAPIResponse {
  result: PendingTransactionDetail[];
}

export interface TokenTransferEventLogsResponse extends ExplorerAPIResponse {
  result: TokenTransferEventLog[];
}

export interface TokensOwnedByAddressResponse extends ExplorerAPIResponse {
  result: TokenDataOwnedByAddress[];
}

export interface ContractDataResponse extends ExplorerAPIResponse {
  result: ContractData;
}

export interface txListByAccountRequestParams extends ApiRequestParamsBase {
  module: 'account';
  action: 'txlist' | 'pendingtxlist';
  address: string;
}

export interface tokenTransfersRequestParams extends ApiRequestParamsBase {
  module: 'account';
  action: 'tokentx';
  address: string;
}

export interface tokensOwnedByAddressRequestParams extends ApiRequestParamsBase {
  module: 'account';
  action: 'tokenlist';
  address: string;
}

export interface tokenContractDataRequestParams extends ApiRequestParamsBase {
  module: 'token';
  action: 'getToken';
  contractaddress: string;
}

export interface ApiRequestParamsBase {
  module: 'account' | 'token';
  action: 'txlist' | 'pendingtxlist' | 'tokentx' | 'tokenlist' | 'getToken';
}

// Token transfer event log
export interface TokenTransferEventLog {
  value: string;
  blockHash: string;
  blockNumber: string;
  confirmations: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  logIndex: string;
  nonce: string;
  timeStamp: string;
  to: string;
  tokenDecimal: string;
  tokenName: string;
  tokenSymbol: string;
  transactionIndex: string;
}

// Tokens owned by an address
export interface TokenDataOwnedByAddress {
  balance: string;
  contractAddress: string;
  decimals: string;
  name: string;
  symbol: string;
  type: string;
}

export interface ContractData {
  cataloged: boolean;
  contractAddress: string;
  decimals: string;
  name: string;
  symbol: string;
  totalSupply: string;
  type: string;
}

export interface TransactionDetail {
  blockHash: string;
  blockNumber: string;
  confirmations: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  isError: string;
  nonce: string;
  timeStamp: string;
  to: string;
  transactionIndex: string;
  txreceiptStatus: string;
  value: string;
}

export interface PendingTransactionDetail {
  contractAddress: string;
  cumulativeGasUsed: string;
  from: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  hash: string;
  input: string;
  nonce: string;
  to: string;
  value: string;
}
