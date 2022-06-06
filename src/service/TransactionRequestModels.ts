import { UserAsset } from '../models/UserAsset';
import { VoteOption } from '../models/Transaction';
import { NftType } from '../models/Nft';
import { BridgeTransferDirection } from './bridge/BridgeConfig';

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
  tokenContractAddress: string;
  denomId: string;
  sender: string;
  recipient: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
  walletType: string; // normal, ledger
  nftType: NftType;
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

/**
 * Restaking all rewards
 */

export interface AllDelegationRequests {
  validatorAddressList: string[];
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

export interface RestakeStakingRewardRequest extends DelegationRequest {}

export interface WithdrawStakingRewardRequest {
  validatorAddress: string;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}

/**
 * Common Wallet authentication parameters for a Crypto.org mainnet transaction
 */
export interface BaseTxAuth {
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}

/**
 * Withdraw all staking rewards from multiple delegations in a single transaction
 */
export interface WithdrawAllStakingRewardRequest extends BaseTxAuth {
  validatorAddressList: string[];
}

//
export interface BridgeTransferRequest {
  bridgeTransferDirection: BridgeTransferDirection;
  tendermintAddress: string;
  evmAddress: string;
  toAddress: string;
  isCustomToAddress: boolean;
  originAsset: UserAsset;

  amount: string;
  decryptedPhrase: string;
  walletType: string; // normal, ledger
}
