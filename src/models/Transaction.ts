import { ValidatorPubKey } from '../service/rpc/NodeRpcModels';

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

export interface StakingTransactionList {
  transactions: Array<StakingTransactionData>;
  totalBalance: string;
  walletId: string;
}

export interface RewardTransactionList {
  transactions: Array<RewardTransaction>;
  walletId: string;
}

export interface TransferTransactionList {
  transactions: Array<TransferTransactionData>;
  walletId: string;
}

export interface ValidatorList {
  validators: Array<ValidatorModel>;
  walletId: string;
}

export interface RewardTransaction {
  delegatorAddress: string;
  validatorAddress: string;
  amount: string;
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
}
