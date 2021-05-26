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
  pagination: NftListPagination;
}

export interface NftListPagination {
  total_record: number;
  total_page: number;
  current_page: number;
  limit: number;
}
