import { UserAsset } from '../models/UserAsset';
import { BridgeTransferDirection, VoteOption } from '../models/Transaction';

export interface TransferRequest {
  toAddress: string;
  amount: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface VoteRequest {
  voteOption: VoteOption;
  proposalID: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface NFTTransferRequest {
  tokenId: string;
  denomId: string;
  sender: string;
  recipient: string;

  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface NFTMintRequest {
  tokenId: string;
  denomId: string;
  sender: string;
  recipient: string;
  data: string;
  name: string;
  uri: string;

  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
}

export interface NFTDenomIssueRequest {
  denomId: string;
  name: string;
  sender: string;
  schema: string;

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

//
export interface BridgeTransferRequest {
  bridgeTransferDirection: BridgeTransferDirection;
  tendermintAddress: string;
  evmAddress: string;

  originAsset: UserAsset;

  amount: string;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}
