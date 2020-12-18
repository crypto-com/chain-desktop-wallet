// Rewards models
export interface RewardElement {
  denom: string;
  amount: string;
}

export interface Reward {
  validator_address: string;
  reward: RewardElement[];
}

export interface Total {
  denom: string;
  amount: string;
}

export interface RewardResponse {
  rewards: Reward[];
  total: Total[];
}

// Delegation models
export interface Delegation {
  delegator_address: string;
  validator_address: string;
  shares: string;
}

export interface Balance {
  denom: string;
  amount: string;
}

export interface DelegationResponse {
  delegation: Delegation;
  balance: Balance;
}

export interface Pagination {
  next_key?: any;
  total: string;
}

export interface DelegationResult {
  delegation_responses: DelegationResponse[];
  pagination: Pagination;
}

// Transfers models
export interface TransferData {
  name: string;
  height: number;
  msgName: string;
  version: number;
  msgIndex: number;
  uuid: string;
  amount: string;
  txHash: string;
  toAddress: string;
  fromAddress: string;
}

export interface TransactionResult {
  account: string;
  blockHeight: number;
  blockHash: string;
  blockTime: string;
  transactionHash: string;
  success: boolean;
  messageIndex: number;
  messageType: string;
  data: TransferData;
}

export interface TransactionList {
  result: TransactionResult[];
}
