// Rewards models
export interface RewardElement {
  denom: string;
  amount: string;
}

export interface Reward {
  validator_address: string;
  reward: RewardElement[];
}

export interface Total {
  denom: string;
  amount: string;
}

export interface RewardResponse {
  rewards: Reward[];
  total: Total[];
}

// Delegation models
export interface Delegation {
  delegator_address: string;
  validator_address: string;
  shares: string;
}

export interface Undelegation {
  balance: string;
  completion_time: string;
  creation_height: string;
  initial_balance: string;
}

export interface Balance {
  denom: string;
  amount: string;
}

export interface BalancesResponse {
  balances: Balance[];
}

export interface DelegationResponse {
  delegation: Delegation;
  balance: Balance;
}

export interface UnbondingDelegationResponse {
  delegator_address: string;
  validator_address: string;
  entries: Undelegation[];
}

export interface Pagination {
  next_key: string | null;
  total: string;
}

export interface DelegationResult {
  delegation_responses: DelegationResponse[];
  pagination: Pagination;
}

export interface UnbondingDelegationResult {
  unbonding_responses: UnbondingDelegationResponse[];
  pagination: Pagination;
}

export interface ErrorRpcResponse {
  code: number;
  message: string;
  details: any[];
}

// Transfers models
export interface TransferData {
  name: string;
  height: number;
  msgName: string;
  version: number;
  msgIndex: number;
  uuid: string;
  amount: string;
  txHash: string;
  toAddress: string;
  fromAddress: string;
}

export interface TransactionResult {
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

export interface TransactionList {
  result: TransactionResult[];
}

// Validator models

export interface Description {
  moniker: string;
  identity: string;
  website: string;
  security_contact: string;
  details: string;
}

export interface CommissionRates {
  rate: string;
  max_rate: string;
  max_change_rate: string;
}

export interface Commission {
  commission_rates: CommissionRates;
  update_time: string;
}

export interface Validator {
  operator_address: string;
  consensus_pubkey: ValidatorPubKeyResponse;
  jailed: boolean;
  status: string;
  tokens: string;
  delegator_shares: string;
  description: Description;
  unbonding_height: string;
  unbonding_time: string;
  commission: Commission;
  min_self_delegation: string;
}

export interface ValidatorPubKeyResponse {
  '@type': string;
  key: string;
}

export interface ValidatorListResponse {
  validators: Validator[];
  pagination: Pagination;
}

export interface ValidatorSetResponse {
  readonly height: string;
  readonly result: {
    block_height: string;
    validators: Array<{
      address: string;
      pub_key: ValidatorPubKey;
      proposer_priority: string;
      voting_power: string;
    }>;
  };
}

export interface ValidatorPubKey {
  readonly type: string;
  readonly value: string;
}

// Proposal models

export interface Plan {
  name: string;
  time: Date;
  height: string;
  info: string;
  upgraded_client_state?: any;
}

export interface Content {
  title: string;
  description: string;
  plan: Plan;
}

export interface FinalTallyResult {
  yes: string;
  abstain: string;
  no: string;
  no_with_veto: string;
}

export interface TotalDeposit {
  denom: string;
  amount: string;
}

export interface Proposal {
  proposal_id: string;
  content: Content;
  status: string;
  final_tally_result: FinalTallyResult;
  submit_time: string;
  deposit_end_time: string;
  total_deposit: TotalDeposit[];
  voting_start_time: string;
  voting_end_time: string;
}

export interface AllProposalResponse {
  proposals: Proposal[];
  pagination: Pagination;
}

export interface LoadedTallyResponse {
  tally: FinalTallyResult;
}

/// IBC related

export interface IBCBalanceResponse {
  balances: Balance[];
  pagination: Pagination;
}

export interface DenomTrace {
  path: string;
  base_denom: string;
}

export interface DenomTraceResponse {
  denom_trace: DenomTrace;
}
