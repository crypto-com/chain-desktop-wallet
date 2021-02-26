import { isBroadcastTxFailure, StargateClient } from '@cosmjs/stargate';
import axios, { AxiosInstance } from 'axios';
import { Bytes } from '../../utils/ChainJsLib';
import { CosmosPorts } from '../../config/StaticConfig';
import { DelegationResult, RewardResponse, ValidatorListResponse } from './NodeRpcModels';
import {
  BroadCastResult,
  RewardTransaction,
  StakingTransactionData,
  StakingTransactionList,
  TransactionStatus,
  ValidatorModel,
} from '../../models/Transaction';

export interface INodeRpcService {
  loadAccountBalance(address: string, assetDenom: string): Promise<string>;

  loadSequenceNumber(address: string): Promise<number>;

  fetchAccountNumber(address: string): Promise<number>;

  // Broadcast trx return trx hash
  broadcastTransaction(signedTxHex: string): Promise<BroadCastResult>;

  fetchDelegationBalance(address: string, assetSymbol: string): Promise<StakingTransactionList>;
}

export class NodeRpcService implements INodeRpcService {
  private readonly client: StargateClient;

  private readonly proxyClient: AxiosInstance; // :1317 port

  private constructor(client: StargateClient, proxyClient: AxiosInstance) {
    this.client = client;
    this.proxyClient = proxyClient;
  }

  public static async init(baseUrl: string) {
    const client = await StargateClient.connect(baseUrl + CosmosPorts.Main);
    const proxyClient = axios.create({
      baseURL: baseUrl + CosmosPorts.Proxy,
    });
    return new NodeRpcService(client, proxyClient);
  }

  public async loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    const response = await this.client.getBalance(address, assetDenom);
    return response?.amount ?? '0';
  }

  public async loadSequenceNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.sequence ?? 0;
  }

  public async fetchAccountNumber(address: string): Promise<number> {
    return (await this.client.getAccount(address))?.accountNumber ?? 0;
  }

  public async broadcastTransaction(signedTxHex: string): Promise<BroadCastResult> {
    const TIME_OUT_ERROR = 'timed out waiting for tx to be included in a block';
    try {
      const signedBytes = Bytes.fromHexString(signedTxHex).toUint8Array();
      const broadcastResponse = await this.client.broadcastTx(signedBytes);
      if (isBroadcastTxFailure(broadcastResponse)) {
        // noinspection ExceptionCaughtLocallyJS
        throw new TypeError(`Transaction failed: ${JSON.stringify(broadcastResponse)}`);
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
    const response = await this.proxyClient.get<DelegationResult>(
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
    const response = await this.proxyClient.get<RewardResponse>(
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

  public async loadDelegations(
    address: string,
    assetSymbol: string,
  ): Promise<Array<StakingTransactionData>> {
    const delegationList = await this.fetchDelegationBalance(address, assetSymbol);
    return delegationList.transactions;
  }

  // eslint-disable-next-line class-methods-use-this
  public async loadTopValidators(): Promise<ValidatorModel[]> {
    const response = await this.proxyClient.get<ValidatorListResponse>(
      `/cosmos/staking/v1beta1/validators`,
    );

    return response.data.validators
      .filter(v => !v.jailed)
      .slice(0, 6)
      .map(unjailedValidator => {
        const validator: ValidatorModel = {
          currentShares: unjailedValidator.delegator_shares,
          currentCommissionRate: unjailedValidator.commission.commission_rates.rate,
          validatorAddress: unjailedValidator.operator_address,
        };
        return validator;
      });
  }
}
