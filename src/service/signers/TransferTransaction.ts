export interface TransferTransaction {
  fromAddress: string;
  toAddress: string;
  amount: string;

  memo: string;
  accountNumber: number;
  accountSequence: number;
}

export interface DelegateTransaction {}
