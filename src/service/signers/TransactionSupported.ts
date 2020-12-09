export interface CommonTransaction {
  memo: string;
  accountNumber: number;
  accountSequence: number;
}

export interface TransferTransaction extends CommonTransaction {
  fromAddress: string;
  toAddress: string;
  amount: string;
}

export interface DelegateTransaction extends CommonTransaction {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
}

export interface WithdrawStakingReward extends CommonTransaction {
  delegatorAddress: string;
  validatorAddress: string;
}
