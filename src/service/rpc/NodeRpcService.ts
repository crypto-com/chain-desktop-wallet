import { StargateClient } from '@cosmjs/stargate';
import { IndexedTx } from '@cosmjs/stargate/types/stargateclient';
import axios, { AxiosInstance } from 'axios';
import { Bytes } from '../types/ChainJsLib';
import { CosmosPorts } from '../../config/StaticConfig';
import { DelegationResult, RewardResponse } from './NodeRpcModels';
import {
  BroadCastResult,
  RewardTransaction,
  StakingTransactionData,
  StakingTransactionList,
  TransactionStatus,
} from '../../models/Transaction';

export interface INodeRpcService {
  loadAccountBalance(address: string, assetDenom: string): Promise<string>;

  loadSequenceNumber(address: string): Promise<number>;

  fetchAccountNumber(address: string): Promise<number>;

  // Broadcast trx return trx hash
  broadcastTransaction(signedTxHex: string): Promise<BroadCastResult>;

  getTransactionByHash(transactionHash: string): Promise<IndexedTx>;

  // loadAllTransferTxs(address: string): Promise<TransactionList>;

  fetchDelegationBalance(address: string, assetSymbol: string): Promise<StakingTransactionList>;
}

export interface BroadcastResponse {
  readonly height: number;
  readonly code?: number;
  readonly message?: string;
  readonly transactionHash: string;
  readonly rawLog?: string;
  readonly data?: Uint8Array;
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
      const broadcastResponse: BroadcastResponse = await this.client.broadcastTx(signedBytes);
      if (!broadcastResponse.data || broadcastResponse.code !== undefined) {
        // noinspection ExceptionCaughtLocallyJS
        throw new TypeError(`Transaction failed: ${broadcastResponse}`);
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

  public async getTransactionByHash(transactionHash: string): Promise<IndexedTx> {
    const txs: readonly IndexedTx[] = await this.client.searchTx({ id: transactionHash });
    return txs[0];
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
      .filter(delegation => delegation.balance.denom === assetSymbol)
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
}
