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

/// Nft models

export interface NftResponse {
  denomId: string;
  tokenId: string;
  drop: string;
  tokenBurned: boolean;
  tokenName: string;
  tokenURI: string;
  tokenData: string;
  tokenMinter: string;
  tokenOwner: string;
  tokenMintedAt: string;
  tokenLastEditedAt: string;
  denomName: string;
  denomSchema: string;
}

export interface NftListResponse {
  result: NftResponse[];
  pagination: NftPagination;
}

export interface NftPagination {
  total_record: number;
  total_page: number;
  current_page: number;
  limit: number;
}

/// NFT transfer history

export interface NftTransactionData {
  uuid: string;
  height: number;
  msgName: string;
  version: number;
  msgIndex: number;
  recipient: string;
  name: string;
  txHash: string;
  denomId: string;
  tokenId: string;
  sender: string;
}

export interface NftTransactionResponse {
  denomId: string;
  tokenId: string;
  drop?: any;
  blockHeight: number;
  blockHash: string;
  blockTime: string;
  transactionHash: string;
  success: boolean;
  messageIndex: number;
  messageType: string;
  data: NftTransactionData;
}

export interface NftTransactionListResponse {
  result: NftTransactionResponse[];
  pagination: NftPagination;
}

/// NFT account transactions data

export interface NFTAccountTransactionData {
  msgIndex: number;
  recipient: string;
  txHash: string;
  uuid: string;
  height: number;
  sender: string;
  denomId: string;
  msgName: string;
  tokenId: string;
  version: number;
  name: string;
}

export interface NFTAccountTransactionResponse {
  account: string;
  blockHeight: number;
  blockHash: string;
  blockTime: string;
  transactionHash: string;
  success: boolean;
  messageIndex: number;
  messageType: string;
  data: NFTAccountTransactionData;
}

export interface NFTAccountTransactionListResponse {
  result: NFTAccountTransactionResponse[];
}
