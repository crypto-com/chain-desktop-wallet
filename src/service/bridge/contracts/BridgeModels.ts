/// Please use the gist below to understand what each model means
/// https://gist.github.com/calvinaco/dac4a1f9929d73b9c77b4809c36c2c01
export interface BridgeTransaction {
  bridgeType: string;
  sourceBlockHeight: number;
  sourceBlockTime: string;
  sourceTransactionId: string;
  sourceChain: string;
  sourceAddress: string;
  sourceSmartContractAddress?: any;
  destinationBlockHeight: number;
  destinationBlockTime: string;
  destinationTransactionId: string;
  destinationChain: string;
  destinationAddress: string;
  destinationSmartContractAddress?: any;
  channelId: string;
  amount: string;
  denom: string;
  bridgeFeeAmount?: any;
  bridgeFeeDenom?: any;
  status: string;
  uuid: string;
  createdAt: string;
  updatedAt: string;
  displayAmount: string;
  displayDenom: string;
}

export interface BridgeTransactionListResponse {
  result: BridgeTransaction[];
}

export interface BridgeTransactionStatusResponse {
  result: BridgeTransaction;
}

export interface BridgeTransactionHistoryList {
  walletId: string;
  transactions: BridgeTransaction[];
}

export enum BridgeTransactionStatus {
  PENDING = 'Pending',
  FAILED = 'FailedOnChain',
  CANCELLED = 'Cancelled',
  CONFIRMED = 'CounterpartyConfirmed',
  REJECTED = 'CounterpartyRejected',
}
