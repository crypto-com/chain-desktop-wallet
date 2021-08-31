import { isBroadcastTxFailure, StargateClient } from '@cosmjs/stargate';
import axios, { AxiosInstance } from 'axios';
import { Big } from 'big.js';
import { Bytes } from '../../utils/ChainJsLib';
import { NodePorts } from '../../config/StaticConfig';
import {
  AllProposalResponse,
  BalanceResponse,
  DelegationResult,
  DenomTrace,
  DenomTraceResponse,
  FinalTallyResult,
  IBCBalanceResponse,
  LoadedTallyResponse,
  Proposal,
  RewardResponse,
  ValidatorListResponse,
  ValidatorPubKey,
  ValidatorSetResponse,
} from './NodeRpcModels';
import {
  BroadCastResult,
  RewardTransaction,
  StakingTransactionData,
  StakingTransactionList,
  TransactionStatus,
  ValidatorModel,
} from '../../models/Transaction';
import { Session } from '../../models/Session';
import { AssetCreationType, UserAsset, UserAssetType } from '../../models/UserAsset';

export interface INodeRpcService {
  loadAccountBalance(address: string, assetDenom: string): Promise<string>;

  loadSequenceNumber(address: string): Promise<number>;

  fetchAccountNumber(address: string): Promise<number>;

  // Broadcast trx return trx hash
  broadcastTransaction(signedTxHex: string): Promise<BroadCastResult>;

  fetchDelegationBalance(address: string, assetSymbol: string): Promise<StakingTransactionList>;

  fetchStakingRewards(address: string, assetSymbol: string): Promise<Array<RewardTransaction>>;

  loadStakingBalance(address: string, assetSymbol: string): Promise<string>;

  loadTopValidators(): Promise<ValidatorModel[]>;

  loadIBCAssets(session: Session): Promise<UserAsset[]>;

  getIBCAssetTrace(ibcHash: string): Promise<DenomTrace>;
}

// Load all 100 active validators
const MAX_VALIDATOR_LOAD = 100;

export class NodeRpcService implements INodeRpcService {
  private readonly tendermintClient: StargateClient;

  private readonly cosmosClient: AxiosInstance; // :1317 port

  constructor(client: StargateClient, proxyClient: AxiosInstance) {
    this.tendermintClient = client;
    this.cosmosClient = proxyClient;
  }

  public static async init(baseUrl: string) {
    const client = await StargateClient.connect(baseUrl + NodePorts.Tendermint);
    const proxyClient = axios.create({
      baseURL: baseUrl + NodePorts.Cosmos,
    });
    return new NodeRpcService(client, proxyClient);
  }

  public async loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    const response = await this.cosmosClient.get<BalanceResponse>(
      `/cosmos/bank/v1beta1/balances/${address}/${assetDenom}`,
    );
    const balanceData = response?.data;
    return balanceData?.balance?.amount ?? '0';
  }

  public async loadSequenceNumber(address: string): Promise<number> {
    return (await this.tendermintClient.getAccount(address))?.sequence ?? 0;
  }

  public async fetchAccountNumber(address: string): Promise<number> {
    return (await this.tendermintClient.getAccount(address))?.accountNumber ?? 0;
  }

  public async broadcastTransaction(signedTxHex: string): Promise<BroadCastResult> {
    const TIME_OUT_ERROR = 'timed out waiting for tx to be included in a block';
    try {
      const signedBytes = Bytes.fromHexString(signedTxHex).toUint8Array();
      const broadcastResponse = await this.tendermintClient.broadcastTx(signedBytes);
      if (isBroadcastTxFailure(broadcastResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw new TypeError(`${broadcastResponse.rawLog}`);
      }
      return {
        transactionHash: broadcastResponse.transactionHash,
      };
    } catch (e) {
      if (e.toString().includes(TIME_OUT_ERROR)) {
        return {
          code: -32603,
          message: TIME_OUT_ERROR,
        };
      }
      throw e;
    }
  }

  public async fetchDelegationBalance(
    address: string,
    assetSymbol: string,
  ): Promise<StakingTransactionList> {
    const response = await this.cosmosClient.get<DelegationResult>(
      `/cosmos/staking/v1beta1/delegations/${address}`,
    );
    const delegationResponses = response.data.delegation_responses;
    let totalSum = 0;
    const delegationTransactionList: Array<StakingTransactionData> = [];
    delegationResponses
      .filter(
        delegation =>
          delegation.balance.denom === assetSymbol && Number(delegation.balance.amount) > 0,
      )
      .forEach(delegation => {
        totalSum += Number(delegation.balance.amount);
        delegationTransactionList.push({
          assetSymbol: delegation.balance.denom.toString().toUpperCase(),
          date: '',
          delegatorAddress: delegation.delegation.delegator_address,
          hash: '',
          memo: '',
          stakedAmount: delegation.balance.amount,
          status: TransactionStatus.SUCCESS,
          validatorAddress: delegation.delegation.validator_address,
        });
      });

    return {
      totalBalance: String(totalSum),
      transactions: delegationTransactionList,
      walletId: '',
    };
  }

  public async fetchStakingRewards(
    address: string,
    assetSymbol: string,
  ): Promise<Array<RewardTransaction>> {
    const response = await this.cosmosClient.get<RewardResponse>(
      `cosmos/distribution/v1beta1/delegators/${address}/rewards`,
    );
    const { rewards } = response.data;
    const rewardList: Array<RewardTransaction> = [];
    rewards.forEach(stakingReward => {
      let localRewardSum = 0;
      stakingReward.reward.forEach(rw => {
        if (rw.denom === assetSymbol) {
          localRewardSum += Number(rw.amount);
        }
      });
      rewardList.push({
        amount: String(localRewardSum),
        delegatorAddress: address,
        validatorAddress: stakingReward.validator_address,
      });
    });

    return rewardList;
  }

  public async loadStakingBalance(address: string, assetSymbol: string): Promise<string> {
    const delegationList = await this.fetchDelegationBalance(address, assetSymbol);
    return delegationList.totalBalance;
  }

  // eslint-disable-next-line class-methods-use-this
  public async loadLatestTally(proposalID: string): Promise<FinalTallyResult | null> {
    try {
      const url = `/cosmos/gov/v1beta1/proposals/${proposalID}/tally`;
      const response = await this.cosmosClient.get<LoadedTallyResponse>(url);
      return response.data.tally;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOAD_TALLY', e);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadProposals(proposalStatus: string[]) {
    let proposals: Proposal[] = [];
    let nextKey: string | null = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let fetchedProposals: Proposal[];
      // eslint-disable-next-line no-await-in-loop
      [fetchedProposals, nextKey] = await this.loadProposalsPaginated(nextKey);
      const filteredProposals = fetchedProposals.filter(proposal =>
        proposalStatus.includes(proposal.status),
      );

      proposals = [...proposals, ...filteredProposals];
      if (nextKey === null) {
        break;
      }
    }

    return proposals;
  }

  public async loadProposalsPaginated(
    nextPage: string | null,
  ): Promise<[Proposal[], PaginationNextKey]> {
    const baseUrl = `/cosmos/gov/v1beta1/proposals`;
    const url =
      nextPage === null ? baseUrl : `${baseUrl}?pagination.key=${encodeURIComponent(nextPage)}`;
    const response = await this.cosmosClient.get<AllProposalResponse>(url);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proposals, pagination } = response.data;
    return [proposals, pagination.next_key];
  }

  public async loadDelegations(
    address: string,
    assetSymbol: string,
  ): Promise<Array<StakingTransactionData>> {
    const delegationList = await this.fetchDelegationBalance(address, assetSymbol);
    return delegationList.transactions;
  }

  // eslint-disable-next-line class-methods-use-this
  public async loadTopValidators(): Promise<ValidatorModel[]> {
    let validators: ValidatorModel[] = [];
    let nextKey: string | null = null;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      let fetchedValidators: ValidatorModel[];
      // eslint-disable-next-line no-await-in-loop
      [fetchedValidators, nextKey] = await this.fetchValidators(nextKey);

      validators = [...validators, ...fetchedValidators];
      if (nextKey === null) {
        break;
      }
    }

    const activeValidators = (await this.fetchLatestActiveValidators()).reduce(
      (pubKeyMap, validator) => {
        pubKeyMap[validator.value] = true;
        return pubKeyMap;
      },
      {},
    );

    let topValidators = validators
      .filter(v => v.status === 'BOND_STATUS_BONDED')
      .filter(v => !v.jailed)
      .filter(v => !!activeValidators[v.pubKey.value])
      .sort((v1, v2) => Big(v2.currentShares).cmp(Big(v1.currentShares)))
      .slice(0, MAX_VALIDATOR_LOAD);

    let totalShares = new Big(0);
    topValidators.forEach(validator => {
      totalShares = totalShares.add(validator.currentShares);
    });

    // Add cumulativeShares
    let cumulativeShares = new Big(0);
    topValidators = topValidators.map(validator => {
      const validatorWithCumulativeShares = {
        ...validator,
        cumulativeShares: cumulativeShares.toString(),
        cumulativeSharesExcludePercentage: cumulativeShares
          .div(totalShares)
          .times(100)
          .toString(),
        cumulativeSharesIncludePercentage: cumulativeShares
          .add(new Big(validator.currentShares))
          .div(totalShares)
          .times(100)
          .toString(),
      };
      cumulativeShares = cumulativeShares.add(new Big(validator.currentShares));
      return validatorWithCumulativeShares;
    });

    return topValidators;
  }

  private async fetchLatestActiveValidators(): Promise<ValidatorPubKey[]> {
    const response = await this.cosmosClient.get<ValidatorSetResponse>('/validatorsets/latest');

    return response.data.result.validators.map(v => v.pub_key);
  }

  private async fetchValidators(
    pagination: string | null,
  ): Promise<[ValidatorModel[], PaginationNextKey]> {
    const baseUrl = '/cosmos/staking/v1beta1/validators';
    const url =
      pagination === null ? baseUrl : `${baseUrl}?pagination.key=${encodeURIComponent(pagination)}`;
    const response = await this.cosmosClient.get<ValidatorListResponse>(url);

    return [
      response.data.validators.map(validator => {
        return {
          status: validator.status,
          jailed: validator.jailed,
          validatorWebSite: validator.description.website,
          maxCommissionRate: validator.commission.commission_rates.max_rate,
          securityContact: validator.description.security_contact,
          validatorName: validator.description.moniker,
          currentTokens: validator.tokens,
          currentShares: validator.delegator_shares,
          currentCommissionRate: validator.commission.commission_rates.rate,
          validatorAddress: validator.operator_address,
          pubKey: {
            type: validator.consensus_pubkey['@type'],
            value: validator.consensus_pubkey.key,
          },
        };
      }),
      response.data.pagination.next_key,
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  async loadIBCAssets(session: Session): Promise<UserAsset[]> {
    const ibcAssets: UserAsset[] = [];
    let nextKey: string | null = null;
    const { address } = session.wallet;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const baseUrl = `/cosmos/bank/v1beta1/balances/${address}`;
      const url =
        nextKey !== null ? `${baseUrl}?pagination.key=${encodeURIComponent(nextKey)}` : baseUrl;

      // eslint-disable-next-line no-await-in-loop
      const assetBalanceResponse = await this.cosmosClient.get<IBCBalanceResponse>(url);
      const loadedIbcAssets = assetBalanceResponse.data.balances
        .filter(balance => balance.denom.startsWith('ibc/'))
        .map(balance => {
          const ibcDenom = balance.denom;
          const ibcDenomHash = ibcDenom.split('/').pop();
          const asset: UserAsset = {
            balance: balance.amount,
            decimals: 8,
            description: '',
            icon_url: '',
            identifier: `${ibcDenom}__${session.wallet.identifier}`,
            mainnetSymbol: ibcDenom,
            name: ibcDenom,
            stakedBalance: '0',
            symbol: ibcDenom,
            walletId: session.wallet.identifier,
            ibcDenomHash,
            assetType: UserAssetType.IBC,
            assetCreationType: AssetCreationType.DYNAMIC,
          };
          return asset;
        });

      ibcAssets.push(...loadedIbcAssets);
      const { pagination } = assetBalanceResponse.data;

      if (pagination.next_key === null) {
        break;
      }
      nextKey = pagination.next_key;
    }

    return ibcAssets;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  async getIBCAssetTrace(ibcHash: string): Promise<DenomTrace> {
    const denomTraceResponse = await this.cosmosClient.get<DenomTraceResponse>(
      `ibc/applications/transfer/v1beta1/denom_traces/${ibcHash}`,
    );

    return denomTraceResponse.data.denom_trace;
  }
}

type PaginationNextKey = string | null;
