export interface TransferData {
  version: number;
  msgIndex: number;
  fromAddress: string;
  amount: TransferDataAmount[];
  height: number;
  txHash: string;
  msgName: string;
  toAddress: string;
  name: string;
  uuid: string;
}

export interface TransferDataAmount {
  denom: string;
  amount: string;
}

export interface TransferResult {
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

export interface TransferListResponse {
  result: TransferResult[];
}
