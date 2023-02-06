import { Proposal, ValidatorPubKey } from '../service/rpc/NodeRpcModels';
import {
  NftAccountTransactionResponse,
  NftTransactionResponse,
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

export enum EthereumTransactionType {
  TRANSFER = 'transfer',
  UTF8TRANSFER = '0x636c6965',
  APPROVE = 'approve',
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
  autoClaimedRewards?: string;
}

export interface UnbondingDelegationData {
  delegatorAddress: string;
  validatorAddress: string;
  unbondingAmount: string;
  completionTime: string;
}

export interface RewardTransactionData {
  receiverAddress?: string;
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
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

export interface NftAccountTransactionData extends NftAccountTransactionResponse {}

/**
 * COMMON ATTRIBUTES MODELS
 */

export type CommonAttributesRecord =
  | NftAttributesRecord
  | StakingAttributesRecord
  | RewardAttributesRecord;

export interface CommonAttributesByWalletBase {
  customParams?: { [key: string]: any }; // Note: We WILL dedicate a storage for `customParams` like totalBalance, totalRewards, estimatedApy etc.
  walletId: string;
}

export interface NftAttributesRecord extends CommonAttributesByWalletBase {
  type: 'nft';
  customParams: {
    nftQuery?: NftQueryParams;
  };
}

export interface StakingAttributesRecord extends CommonAttributesByWalletBase {
  type: 'staking';
  customParams: {
    totalBalance?: string;
  };
}

export interface RewardAttributesRecord extends CommonAttributesByWalletBase {
  type: 'reward';
  customParams: {
    totalBalance: string;
    claimedRewardsBalance?: string;
    estimatedRewardsBalance?: string;
    estimatedApy?: string;
  };
}

/**
 * COMMON TRANSACTION MODELS
 */

export type CommonTransactionRecord =
  | StakingTransactionRecord
  | RewardTransactionRecord
  | TransferTransactionRecord
  | NftAccountTransactionRecord
  | IBCTransactionRecord
  | NftTransferRecord;

export interface BaseCommonTransaction {
  walletId: string;
  assetId?: string;
  assetType?: UserAssetType;
  txHash?: string;
}

export interface StakingTransactionRecord extends BaseCommonTransaction {
  txType: 'staking';
  messageTypeName?: string;
  txData: StakingTransactionData | UnbondingDelegationData;
}

export interface RewardTransactionRecord extends BaseCommonTransaction {
  txType: 'reward';
  messageTypeName?: string;
  txData: RewardTransactionData;
}

export interface TransferTransactionRecord extends BaseCommonTransaction {
  txType: 'transfer';
  messageTypeName?: string;
  txData: TransferTransactionData;
}

export interface NftAccountTransactionRecord extends BaseCommonTransaction {
  txType: 'nftAccount';
  messageTypeName?: string;
  txData: NftAccountTransactionData;
}

export interface NftTransferRecord extends BaseCommonTransaction {
  txType: 'nftTransfer';
  messageTypeName?: string;
  txData: NftTransferModel;
}

export interface IBCTransactionRecord extends BaseCommonTransaction {
  txType: 'ibc';
  messageTypeName?: string;
  sourceChain?: string;
  txData: BridgeTransaction;
}

export interface StakingTransactionList {
  transactions: Array<StakingTransactionData>;
  totalBalance: string;
  walletId: string;
}

export interface RewardTransactionList {
  transactions: Array<RewardTransactionData>;
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
  apy?: string;
  uptime?: string;
  cumulativeSharesIncludePercentage?: string;
  cumulativeSharesExcludePercentage?: string;
}

export interface ProposalModel extends Proposal {}

export interface NftTransferModel extends NftTransactionResponse {}

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

// https://raw.githubusercontent.com/crypto-com/chain-indexing/4c79a3dba2911e738af1d2b2d639f4744c15f58b/usecase/parser/register.go
export enum MsgTypeName {
  MsgSend = '/cosmos.bank.v1beta1.MsgSend',
  MsgMultiSend = '/cosmos.bank.v1beta1.MsgMultiSend',
  MsgSetWithdrawAddress = '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
  MsgWithdrawDelegatorReward = '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
  MsgWithdrawValidatorCommission = '/cosmos.distribution.v1beta1.MsgWithdrawValidatorCommission',
  MsgFundCommunityPool = '/cosmos.distribution.v1beta1.MsgFundCommunityPool',
  MsgSubmitProposal = '/cosmos.gov.v1beta1.MsgSubmitProposal',
  MsgVote = '/cosmos.gov.v1beta1.MsgVote',
  MsgDeposit = '/cosmos.gov.v1beta1.MsgDeposit',
  MsgDelegate = '/cosmos.staking.v1beta1.MsgDelegate',
  MsgUndelegate = '/cosmos.staking.v1beta1.MsgUndelegate',
  MsgBeginRedelegate = '/cosmos.staking.v1beta1.MsgBeginRedelegate',
  MsgCreateValidator = '/cosmos.staking.v1beta1.MsgCreateValidator',
  MsgEditValidator = '/cosmos.staking.v1beta1.MsgEditValidator',
  MsgUnjail = '/cosmos.slashing.v1beta1.MsgUnjail',
  MsgIssueDenom = '/chainmain.nft.v1.MsgIssueDenom',
  MsgMintNFT = '/chainmain.nft.v1.MsgMintNFT',
  MsgTransferNFT = '/chainmain.nft.v1.MsgTransferNFT',
  MsgEditNFT = '/chainmain.nft.v1.MsgEditNFT',
  MsgBurnNFT = '/chainmain.nft.v1.MsgBurnNFT',
  MsgCreateClient = '/ibc.core.client.v1.MsgCreateClient',
  MsgUpdateClient = '/ibc.core.client.v1.MsgUpdateClient',
  MsgConnectionOpenInit = '/ibc.core.connection.v1.MsgConnectionOpenInit',
  MsgConnectionOpenTry = '/ibc.core.connection.v1.MsgConnectionOpenTry',
  MsgConnectionOpenAck = '/ibc.core.connection.v1.MsgConnectionOpenAck',
  MsgConnectionOpenConfirm = '/ibc.core.connection.v1.MsgConnectionOpenConfirm',
  MsgChannelOpenInit = '/ibc.core.channel.v1.MsgChannelOpenInit',
  MsgChannelOpenTry = '/ibc.core.channel.v1.MsgChannelOpenTry',
  MsgChannelOpenAck = '/ibc.core.channel.v1.MsgChannelOpenAck',
  MsgChannelOpenConfirm = '/ibc.core.channel.v1.MsgChannelOpenConfirm',
  MsgRecvPacket = '/ibc.core.channel.v1.MsgRecvPacket',
  MsgAcknowledgement = '/ibc.core.channel.v1.MsgAcknowledgement',
  MsgTimeout = '/ibc.core.channel.v1.MsgTimeout',
  MsgTimeoutOnClose = '/ibc.core.channel.v1.MsgTimeoutOnClose',
  MsgChannelCloseInit = '/ibc.core.channel.v1.MsgChannelCloseInit',
  MsgChannelCloseConfirm = '/ibc.core.channel.v1.MsgChannelCloseConfirm',
  MsgTransfer = '/ibc.applications.transfer.v1.MsgTransfer',
  MsgGrant = '/cosmos.authz.v1beta1.MsgGrant',
  MsgRevoke = '/cosmos.authz.v1beta1.MsgRevoke',
  MsgExec = '/cosmos.authz.v1beta1.MsgExec',
  MsgGrantAllowance = '/cosmos.feegrant.v1beta1.MsgGrantAllowance',
  MsgRevokeAllowance = '/cosmos.feegrant.v1beta1.MsgRevokeAllowance',
  MsgCreateVestingAccoun = '/cosmos.vesting.v1beta1.MsgCreateVestingAccount'
}