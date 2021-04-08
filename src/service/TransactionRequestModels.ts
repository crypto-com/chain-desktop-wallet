import { UserAsset } from '../models/UserAsset';
import { VoteOptions } from '../models/Transaction';

export interface TransferRequest {
  toAddress: string;
  amount: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface VoteRequest {
  voteOption: VoteOptions;
  proposalID: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface DelegationRequest {
  validatorAddress: string;
  amount: string;
  memo: string;
  asset: UserAsset;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}

export interface UndelegationRequest extends DelegationRequest {}
export interface RedelegationRequest {
  validatorSourceAddress: string;
  validatorDestinationAddress: string;
  amount: string;
  memo: string;
  asset: UserAsset;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}

export interface WithdrawStakingRewardRequest {
  validatorAddress: string;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}
