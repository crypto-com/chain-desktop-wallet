export interface TransactionUnsigned {
  memo: string;
  accountNumber: number;
  accountSequence: number;
  fee?: string | undefined;
}

export interface TransferTransactionUnsigned extends TransactionUnsigned {
  fromAddress: string;
  toAddress: string;
  amount: string;
}

export interface DelegateTransactionUnsigned extends TransactionUnsigned {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
}

export interface WithdrawStakingRewardUnsigned extends TransactionUnsigned {
  delegatorAddress: string;
  validatorAddress: string;
}

export interface UndelegateTransactionUnsigned extends TransactionUnsigned {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
}
