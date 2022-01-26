import { StargateClient, isDeliverTxFailure } from '@cosmjs/stargate';
import axios, { AxiosInstance } from 'axios';
import { Big } from 'big.js';
import { Bytes } from '../../utils/ChainJsLib';
import { NodePorts } from '../../config/StaticConfig';
import {
  AllProposalResponse,
  BalancesResponse,
  DelegationResult,
  UnbondingDelegationResult,
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
  ErrorRpcResponse,
  UnbondingDelegationResponse,
  DelegationResponse,
} from './NodeRpcModels';
import {
  BroadCastResult,
  RewardTransactionData,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  UnbondingDelegationData,
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

  fetchStakingRewardsBalance(address: string, assetSymbol: string): Promise<RewardTransactionList>;

  loadStakingBalance(address: string, assetSymbol: string): Promise<string>;

  loadTopValidators(): Promise<ValidatorModel[]>;

  loadIBCAssets(session: Session): Promise<UserAsset[]>;

  getIBCAssetTrace(ibcHash: string): Promise<DenomTrace>;

  loadLatestBlock(address: string): Promise<number>;
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
    // take first 2 words
    const words = baseUrl.split(':', 2);
    const newClientUrl = `${words[0]}:${words[1]}${NodePorts.Tendermint}`;
    const client = await StargateClient.connect(newClientUrl);
    const proxyClient = axios.create({
      baseURL: baseUrl + NodePorts.Cosmos,
    });
    return new NodeRpcService(client, proxyClient);
  }

  public async loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    try {
      const response = await this.cosmosClient.get<BalancesResponse>(
        `/cosmos/bank/v1beta1/balances/${address}`,
      );
      const balanceData = response?.data;
      const balance = balanceData.balances.find(b => b.denom === assetDenom);

      return balance?.amount ?? '0';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `[${NodeRpcService.name}-loadAccountBalance] [Error] Unable to fetch data.`,
        ((error as unknown) as any).response || error,
      );
      return '0';
    }
  }

  public async loadSequenceNumber(address: string): Promise<number> {
    return (await this.tendermintClient.getAccount(address))?.sequence ?? 0;
  }

  public async loadLatestBlock(): Promise<number> {
    return (await this.tendermintClient.getHeight()) ?? 0;
  }

  public async fetchAccountNumber(address: string): Promise<number> {
    return (await this.tendermintClient.getAccount(address))?.accountNumber ?? 0;
  }

  public async broadcastTransaction(signedTxHex: string): Promise<BroadCastResult> {
    const TIME_OUT_ERROR = 'timed out waiting for tx to be included in a block';
    try {
      const signedBytes = Bytes.fromHexString(signedTxHex).toUint8Array();
      const broadcastResponse = await this.tendermintClient.broadcastTx(signedBytes);
      if (isDeliverTxFailure(broadcastResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw new TypeError(`${broadcastResponse.rawLog}`);
      }
      return {
        transactionHash: broadcastResponse.transactionHash,
      };
    } catch (e) {
      if (((e as unknown) as any).toString().includes(TIME_OUT_ERROR)) {
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
    let paginationKey: PaginationNextKey = null;
    let totalSumFinal = 0;
    const delegationTransactionListFinal: Array<StakingTransactionData> = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // Fetch paginated data
      // eslint-disable-next-line no-await-in-loop
      const [paginatedDelegationResponse, nextKey] = await this.fetchDelegationsByAddressPaginated(
        paginationKey,
        address,
      );
      // process data above
      const delegationTransactionListLoop: Array<StakingTransactionData> = [];
      let totalSumLoop = 0;

      paginatedDelegationResponse
        .filter(
          delegation =>
            delegation.balance.denom === assetSymbol && Number(delegation.balance.amount) > 0,
        )
        .forEach(delegation => {
          // Note: Usage of JS `Number` here, Ignore it if not critical
          totalSumLoop += Number(delegation.balance.amount);
          delegationTransactionListLoop.push({
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

      // create/push to final list
      totalSumFinal += totalSumLoop;
      delegationTransactionListFinal.push(...delegationTransactionListLoop);

      // Breakout if there are no more pages left
      if (nextKey === null) {
        break;
      }

      // Update the nextKey to fetch
      paginationKey = nextKey;
    }

    return {
      totalBalance: String(totalSumFinal),
      transactions: delegationTransactionListFinal,
      walletId: '',
    };
  }

  public async fetchDelegationsByAddressPaginated(
    paginationKey: PaginationNextKey,
    address: string,
  ): Promise<[DelegationResponse[], PaginationNextKey]> {
    const baseUrl = `/cosmos/staking/v1beta1/delegations/${address}`;
    const url =
      paginationKey === null
        ? baseUrl
        : `${baseUrl}?pagination.key=${encodeURIComponent(paginationKey)}`;

    let response;
    try {
      response = await this.cosmosClient.get<DelegationResult | ErrorRpcResponse>(url);
    } catch (error) {
      response = ((error as unknown) as any).response;
    } finally {
      if (response.status !== 200) {
        // eslint-disable-next-line no-console
        console.log(
          `[NodeRpcService.fetchDelegationsByAddressPaginated] | HTTP Code: ${
            response.status
          } | Response: ${JSON.stringify(response.data)}`,
        );

        // This is a special case API error response, hence needed manual checking for `code`
        if ((response.data as ErrorRpcResponse).code === 5) {
          // eslint-disable-next-line no-unsafe-finally
          return [[], null];
        }

        // If `code` in error response is not `5`, throw a general error.
        // eslint-disable-next-line no-unsafe-finally
        throw new Error(
          `[NodeRpcService.fetchDelegationsByAddressPaginated] | HTTP Code: ${
            response.status
          } | Response: ${JSON.stringify(response.data)}`,
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { delegation_responses, pagination } = response.data as DelegationResult;
    return [delegation_responses, pagination.next_key];
  }

  public async fetchStakingRewardsBalance(
    address: string,
    assetSymbol: string,
  ): Promise<RewardTransactionList> {
    let response;

    try {
      response = await this.cosmosClient.get<RewardResponse>(
        `cosmos/distribution/v1beta1/delegators/${address}/rewards`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `[NodeRpcService.fetchStakingRewardsBalance] | HTTP Code: ${
          ((error as unknown) as any).response.status
        } | Response: ${JSON.stringify(((error as unknown) as any).response.data)}`,
      );
      return {
        totalBalance: String(0),
        transactions: [],
        walletId: '',
      };
    }
    const { rewards } = response.data;
    const rewardList: Array<RewardTransactionData> = [];
    let totalSum = 0;
    rewards.forEach(stakingReward => {
      let localRewardSum = 0;
      stakingReward.reward.forEach(rw => {
        if (rw.denom === assetSymbol) {
          totalSum += Number(rw.amount);
          localRewardSum += Number(rw.amount);
        }
      });
      rewardList.push({
        amount: String(localRewardSum),
        delegatorAddress: address,
        validatorAddress: stakingReward.validator_address,
      });
    });

    return {
      totalBalance: String(totalSum),
      transactions: rewardList,
      walletId: '',
    };
  }

  public async fetchUnbondingDelegationBalance(address: string) {
    const unbondingDelegationDataList: UnbondingDelegationData[] = [];
    let paginationKey: PaginationNextKey = null;
    let totalSumFinal = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      // eslint-disable-next-line no-await-in-loop
      const response = await this.fetchUnbondingDelegationsPaginated(paginationKey, address);

      const [unbondingDelegationResponsesPaginated, nextPaginationKey] = response;

      let totalSumLoop = 0;
      const unbondingDelegationTransactionListLoop: Array<UnbondingDelegationData> = [];

      unbondingDelegationResponsesPaginated.forEach(delegation => {
        delegation.entries.forEach(entry => {
          totalSumLoop += Number(entry.balance);
          unbondingDelegationTransactionListLoop.push({
            delegatorAddress: delegation.delegator_address,
            completionTime: entry.completion_time,
            unbondingAmount: entry.balance,
            validatorAddress: delegation.validator_address,
          });
        });
      });

      // Update final variables
      totalSumFinal += totalSumLoop;
      unbondingDelegationDataList.push(...unbondingDelegationTransactionListLoop);

      // Check pagination
      if (nextPaginationKey === null) {
        break;
      }

      // Update current Pagination with new pagination key
      paginationKey = nextPaginationKey;
    }

    return {
      totalBalance: String(totalSumFinal),
      unbondingDelegations: unbondingDelegationDataList,
      walletId: '',
    };
  }

  public async fetchUnbondingDelegationsPaginated(
    paginationKey: PaginationNextKey,
    address: string,
  ): Promise<[UnbondingDelegationResponse[], PaginationNextKey]> {
    const baseUrl = `/cosmos/staking/v1beta1/delegators/${address}/unbonding_delegations`;
    const url =
      paginationKey === null
        ? baseUrl
        : `${baseUrl}?pagination.key=${encodeURIComponent(paginationKey)}`;

    let response;
    try {
      response = await this.cosmosClient.get<UnbondingDelegationResult>(url);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `[NodeRpcService.fetchUnbondingDelegationsPaginated] | HTTP Code: ${
          ((error as unknown) as any).response.status
        } | Response: ${JSON.stringify(((error as unknown) as any).response.data)}`,
      );

      return [[], null];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { unbonding_responses, pagination } = response.data as UnbondingDelegationResult;
    return [unbonding_responses, pagination.next_key];
  }

  public async loadStakingBalance(address: string, assetSymbol: string): Promise<string> {
    const delegationList = await this.fetchDelegationBalance(address, assetSymbol);
    return delegationList.totalBalance;
  }

  public async loadStakingRewardsBalance(address: string, assetSymbol: string): Promise<string> {
    const rewardsList = await this.fetchStakingRewardsBalance(address, assetSymbol);
    return rewardsList.totalBalance;
  }

  public async loadUnbondingBalance(address: string): Promise<string> {
    const unbondingDelegationList = await this.fetchUnbondingDelegationBalance(address);
    return unbondingDelegationList.totalBalance;
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
      // Sort by Lowest voting power, and then Lowest commission
      .sort((v1, v2) => Big(v1.currentCommissionRate).cmp(Big(v2.currentCommissionRate)))
      .sort((v1, v2) => Big(v1.currentShares).cmp(Big(v2.currentShares)))
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
            unbondingBalance: '0',
            rewardsBalance: '0',
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
    try {
      const denomTraceResponse = await this.cosmosClient.get<DenomTraceResponse>(
        `ibc/applications/transfer/v1beta1/denom_traces/${ibcHash}`,
      );

      return denomTraceResponse.data.denom_trace;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(
        `[${NodeRpcService.name}-getIBCAssetTrace] [Error] Unable to fetch data.`,
        ((error as unknown) as any).response || error,
      );
      throw new Error(`[${NodeRpcService.name}-getIBCAssetTrace] [Error] Unable to fetch data.`);
    }
  }
}

type PaginationNextKey = string | null;
