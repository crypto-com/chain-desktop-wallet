import { Proposal, ValidatorPubKey } from '../service/rpc/NodeRpcModels';
import {
  NftAccountTransactionResponse,
  NftResponse,
  NftTransactionResponse,
  NftDenomData,
} from '../service/rpc/ChainIndexingModels';
import { UserAssetType } from './UserAsset';
import { BridgeTransaction } from '../service/bridge/contracts/BridgeModels';

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
}

export enum TransactionDirection {
  INCOMING,
  OUTGOING,
  SELF,
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

export interface UnbondingDelegationData {
  delegatorAddress: string;
  validatorAddress: string;
  unbondingAmount: string;
  completionTime: string;
}

export interface NftTransactionData {
  transactionHash: string;
  data: {
    denomId: string;
    tokenId: string;
  };
  receiverAddress: string;
  blockTime: string;
  status: boolean;
}

export enum NftTransactionType {
  ISSUE_DENOM = 'MsgIssueDenom',
  MINT_NFT = 'MsgMintNFT',
  EDIT_NFT = 'MsgEditNFT',
  BURN_NFT = 'MsgBurnNFT',
  TRANSFER_NFT = 'MsgTransferNFT',
}

export interface NftAccountTransactionData extends NftAccountTransactionResponse { }

export interface CommonAttributesByWallet {
  customParams?: { [key: string]: string } // Note: We WILL dedicate a storage for `customParams` like totalBalance, totalRewards, estimatedApy etc.
  walletId: string;
  assetId?: string;
  assetType: UserAssetType;
}

export interface BaseCommonTransaction {
  walletId: string;
  assetId?: string;
  assetType: UserAssetType;
}

export interface CommonTransaction extends BaseCommonTransaction {
  walletId: string;
  assetId?: string;
  txType: string;
  messageTypeName?: string;
  txData: StakingTransactionData | RewardTransaction |TransferTransactionData | NftTransactionData | BridgeTransaction
}

export interface StakingTransactionList {
  transactions: Array<StakingTransactionData>;
  totalBalance: string;
  walletId: string;
}

export interface RewardTransactionList {
  transactions: Array<RewardTransaction>;
  totalBalance: string;
  claimedRewardsBalance?: string;
  estimatedRewardsBalance?: string;
  estimatedApy?: string;
  walletId: string;
}

export interface UnbondingDelegationList {
  delegations: Array<UnbondingDelegationData>;
  totalBalance: string;
  walletId: string;
}

export interface TransferTransactionList {
  transactions: Array<TransferTransactionData>;
  walletId: string;
  assetId?: string;
}

export interface NftList {
  nfts: Array<NftModel>;
  walletId: string;
}

export interface NftQueryParams {
  tokenId: string;
  denomId: string;
}

export interface NftTransactionHistory {
  transfers: Array<NftTransferModel>;
  walletId: string;
  nftQuery: NftQueryParams;
}

export interface ValidatorList {
  validators: Array<ValidatorModel>;
  chainId: string;
}

export interface ProposalList {
  proposals: Array<ProposalModel>;
  chainId: string;
}

export interface RewardTransaction {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
}

export interface RewardsBalances {
  claimedRewardsBalance: string;
  estimatedApy: string;
  estimatedRewardsBalance: string;
  totalBalance: string;
}

export interface BroadCastResult {
  readonly transactionHash?: string;
  readonly message?: string;
  readonly code?: number;
}

export interface ValidatorModel {
  readonly status: string;
  readonly jailed: boolean;
  readonly validatorName: string;
  readonly validatorAddress: string;
  readonly validatorWebSite: string;
  readonly securityContact: string;
  readonly currentCommissionRate: string;
  readonly maxCommissionRate: string;
  readonly currentTokens: string;
  readonly currentShares: string;
  readonly pubKey: ValidatorPubKey;
  displayWarningColumn?: boolean;
  cumulativeSharesIncludePercentage?: string;
  cumulativeSharesExcludePercentage?: string;
}

export interface ProposalModel extends Proposal {}

export interface NftTokenData {
  name?: string;
  drop?: string;
  description?: string;
  image?: string;
  mimeType?: string;
  animation_url?: string;
  animationUrl?: string;
  animationMimeType?: string;
}

export interface NftModel extends NftResponse {
  isMintedByCDC: boolean;
  marketplaceLink: string;
}

export interface NftDenomModel extends NftDenomData {}

export interface NftProcessedModel extends Omit<NftModel, 'tokenData'> {
  tokenData: NftTokenData;
}

export interface NftTransferModel extends NftTransactionResponse {}

// export interface NFTAccountTransactionModel extends NFTAccountTransactionResponse {}

export interface NftAccountTransactionList {
  transactions: Array<NftAccountTransactionData>;
  walletId: string;
}

export const ProposalStatuses = {
  PROPOSAL_STATUS_UNSPECIFIED: 'PROPOSAL_STATUS_UNSPECIFIED',
  PROPOSAL_STATUS_DEPOSIT_PERIOD: 'PROPOSAL_STATUS_DEPOSIT_PERIOD',
  PROPOSAL_STATUS_VOTING_PERIOD: 'PROPOSAL_STATUS_VOTING_PERIOD',
  PROPOSAL_STATUS_PASSED: 'PROPOSAL_STATUS_PASSED',
  PROPOSAL_STATUS_REJECTED: 'PROPOSAL_STATUS_REJECTED',
  PROPOSAL_STATUS_FAILED: 'PROPOSAL_STATUS_FAILED',
};

export enum VoteOption {
  VOTE_OPTION_UNSPECIFIED = 0,
  VOTE_OPTION_YES = 1,
  VOTE_OPTION_ABSTAIN = 2,
  VOTE_OPTION_NO = 3,
  VOTE_OPTION_NO_WITH_VETO = 4,
}
