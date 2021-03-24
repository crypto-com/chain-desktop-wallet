export interface TransactionUnsigned {
  memo: string;
  accountNumber: number;
  accountSequence: number;
  fee?: string | undefined;
  gasLimit?: string | undefined;
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

export interface RedelegateTransactionUnsigned extends TransactionUnsigned {
  delegatorAddress: string;
  sourceValidatorAddress: string;
  destinationValidatorAddress: string;
  amount: string;
}

export interface CustomFeeRequest {
  fee: string;
  gasLimit: string;
}
