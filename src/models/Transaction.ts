export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export interface TransactionData {
  hash: string;
  memo: string | null;
  date: string;
  status: TransactionStatus;
  assetSymbol: string;
}

export interface TransferTransactionData extends TransactionData {
  senderAddress: string;
  receiverAddress: string;
  amount: string;
}

export interface StakingTransactionData extends TransactionData {
  delegatorAddress: string;
  validatorAddress: string;
  stakedAmount: string;
}

export interface StakingTransactionList {
  transactions: Array<StakingTransactionData>;
  totalBalance: string;
  walletId: string;
}

export interface RewardTransactionList {
  transactions: Array<RewardTransaction>;
  walletId: string;
}

export interface RewardTransaction {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
}
