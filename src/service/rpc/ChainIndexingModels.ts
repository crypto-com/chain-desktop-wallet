import { MsgTypeName } from '../../models/Transaction';

export interface TransferData {
  version: number;
  msgIndex: number;
  fromAddress: string;
  amount: TransferDataAmount[];
  height: number;
  txHash: string;
  msgName: MsgTypeName;
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

/// Crypto.org Nft models

export interface CryptoOrgNftResponse {
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
  result: CryptoOrgNftResponse[];
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

export interface NftAccountTransactionData {
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

export interface NftAccountTransactionResponse {
  account: string;
  blockHeight: number;
  blockHash: string;
  blockTime: string;
  transactionHash: string;
  success: boolean;
  messageIndex: number;
  messageType: string;
  data: NftAccountTransactionData;
}

export interface NftAccountTransactionListResponse {
  result: NftAccountTransactionResponse[];
}

export interface NftDenomData {
  denomId: string;
  denomName: string;
  denomSchema: string;
  denomCreator: string;
  denomCreatedAt: string;
  denomCreatedAtBlockHeight: number;
}

export interface NftDenomResponse {
  result: NftDenomData | null;
}

export interface AccountMessageListResponse {
  result: AccountMessage[];
  pagination: Pagination;
}

export interface Pagination {
  total_record: number;
  total_page: number;
  current_page: number;
  limit: number;
}

export interface AccountMessage {
  account: string;
  blockHeight: number;
  blockHash: string;
  blockTime: string;
  transactionHash: string;
  success: boolean;
  messageIndex: number;
  messageType: string;
  data: onChainData;
}

export interface onChainData {
  height: number;
  msgName: MsgTypeName;
  txHash: string;
  version: number;
  msgIndex: number;
  name: string;
  uuid: string;
  amount: Amount[];
  autoClaimedRewards?: string;
  toAddress?: string;
  fromAddress?: string;
  delegatorAddress?: string;
  recipientAddress?: string;
  validatorAddress?: string;
  proposalId?: string;
  option?: string;
}

export interface Amount {
  denom: string;
  amount: string;
}

export interface ValidatorListResponse {
  result: ValidatorInfo[];
  pagination: Pagination;
}

export interface ValidatorResponse {
  result: ValidatorInfo;
}

export interface ValidatorInfo {
  operatorAddress: string;
  consensusNodeAddress: string;
  initialDelegatorAddress: string;
  tendermintPubkey: string;
  tendermintAddress: string;
  status: ValidatorStatus;
  jailed: boolean;
  joinedAtBlockHeight: number;
  power: string;
  moniker: string;
  identity: string;
  website: string;
  securityContact: string;
  details: string;
  commissionRate: string;
  commissionMaxRate: string;
  commissionMaxChangeRate: string;
  minSelfDelegation: string;
  totalSignedBlock: number;
  totalActiveBlock: number;
  impreciseUpTime: string;
  votedGovProposal: number;
  powerPercentage: string;
  cumulativePowerPercentage: string;
  apy: string;
}

export enum ValidatorStatus {
  Bonded = 'Bonded',
}

export interface AccountInfoResponse {
  result: AccountInfo;
}

export interface AccountInfo {
  type: string;
  name: string;
  address: string;
  balance: Amount[];
  bondedBalance: Amount[];
  redelegatingBalance: any[];
  unbondingBalance: Amount[];
  totalRewards: Amount[];
  commissions: any[];
  totalBalance: Amount[];
}
