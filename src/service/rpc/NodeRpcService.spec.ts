import 'mocha';
import chai, { expect } from 'chai';
import axios from 'axios';
import moxios from 'moxios';
import { IndexedTx } from '@cosmjs/stargate';
import { INodeRpcService, NodeRpcService } from './NodeRpcService';
import {
  BroadCastResult,
  RewardTransaction,
  StakingTransactionList,
  ValidatorModel,
} from '../../models/Transaction';

chai.use(require('chai-as-promised'));

/* eslint-disable @typescript-eslint/no-unused-vars,class-methods-use-this */
class MockNodeRpcService implements INodeRpcService {
  fetchStakingRewardsBalance(address: string, assetSymbol: string): Promise<RewardTransaction[]> {
    throw new Error('Method not implemented.');
  }

  loadStakingBalance(address: string, assetSymbol: string): Promise<string> {
    throw new Error('Method not implemented.');
  }

  loadTopValidators(): Promise<ValidatorModel[]> {
    throw new Error('Method not implemented.');
  }

  fetchDelegationBalance(address: string, assetSymbol: string): Promise<StakingTransactionList> {
    throw new Error('Method not implemented.');
  }

  broadcastTransaction(signedTxHex: string): Promise<BroadCastResult> {
    return Promise.resolve({
      transactionHash: '5481CCE07ACEF891F701AFEDC746C3478DDFEBFE524F5161ED09BB396F045B46',
    });
  }

  getTransactionByHash(transactionHash: string): Promise<IndexedTx> {
    const mockTx = {
      height: 122460,
      code: 200,
      hash: '5481CCE07ACEF891F701AFEDC746C3478DDFEBFE524F5161ED09BB396F045B46',
      rawLog: '',
      tx: Uint8Array.of(0),
    };
    return Promise.resolve(mockTx);
  }

  loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    return Promise.resolve('3405200');
  }

  fetchAccountNumber(address: string): Promise<number> {
    return Promise.resolve(12);
  }

  loadSequenceNumber(address: string): Promise<number> {
    return Promise.resolve(4);
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars,class-methods-use-this */

describe('Testing NodeRpcService', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });
  it('Test Node Rpc calls ', async () => {
    const nodeRpcService: INodeRpcService = new MockNodeRpcService();

    const broadcastTransactionResult = await nodeRpcService.broadcastTransaction('');
    const sequenceNumber: number = await nodeRpcService.loadSequenceNumber(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
    );
    const accountNumber: number = await nodeRpcService.fetchAccountNumber(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
    );
    const balance: string = await nodeRpcService.loadAccountBalance(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
      'tcro',
    );

    expect(broadcastTransactionResult.transactionHash).to.eq(
      '5481CCE07ACEF891F701AFEDC746C3478DDFEBFE524F5161ED09BB396F045B46',
    );
    expect(sequenceNumber).to.eq(4);
    expect(accountNumber).to.eq(12);
    expect(balance).to.eq('3405200');
  });

  describe('loadTopValidators', () => {
    it('should iterate the pagination', async () => {
      const nodeRpcService: INodeRpcService = new NodeRpcService(null as any, axios.create());
      moxios.stubRequest('/validatorsets/latest', {
        status: 200,
        response: {
          height: '0',
          result: {
            block_height: '108500',
            validators: [
              {
                address: 'address_1',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_1',
                },
                proposer_priority: '1',
                voting_power: '1',
              },
              {
                address: 'address_2',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_2',
                },
                proposer_priority: '2',
                voting_power: '2',
              },
              {
                address: 'address_3',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_3',
                },
                proposer_priority: '3',
                voting_power: '3',
              },
            ],
          },
        },
      });
      moxios.stubRequest('/cosmos/staking/v1beta1/validators', {
        status: 200,
        response: {
          pagination: {
            next_key: 'dummy_next_key_p2',
            total: '3',
          },
          validators: [
            {
              operator_address: 'operator_address_1',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_1',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '1',
              delegator_shares: '1',
              description: {
                moniker: '1',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '1',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
          ],
        },
      });
      moxios.stubRequest('/cosmos/staking/v1beta1/validators?pagination.key=dummy_next_key_p2', {
        status: 200,
        response: {
          pagination: {
            next_key: 'dummy_next_key_p3',
            total: '3',
          },
          validators: [
            {
              operator_address: 'operator_address_2',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_2',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '2',
              delegator_shares: '2',
              description: {
                moniker: '2',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '2',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
          ],
        },
      });
      moxios.stubRequest('/cosmos/staking/v1beta1/validators?pagination.key=dummy_next_key_p3', {
        status: 200,
        response: {
          pagination: {
            next_key: null,
            total: '3',
          },
          validators: [
            {
              operator_address: 'operator_address_3',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_3',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '3',
              delegator_shares: '3',
              description: {
                moniker: '3',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '3',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '3',
            },
          ],
        },
      });

      return expect(nodeRpcService.loadTopValidators()).to.eventually.deep.equal([
        {
          cumulativeShares: '0',
          cumulativeSharesExcludePercentage: '0',
          cumulativeSharesIncludePercentage: '16.666666666666666666',
          currentCommissionRate: '0.100000000000000000',
          currentShares: '1',
          currentTokens: '1',
          jailed: false,
          maxCommissionRate: '0.100000000000000000',
          securityContact: '',
          status: 'BOND_STATUS_BONDED',
          validatorAddress: 'operator_address_1',
          validatorName: '1',
          validatorWebSite: '',
          pubKey: {
            type: '/cosmos.crypto.ed25519.PubKey',
            value: 'consensus_pubkey_1',
          },
        },
        {
          cumulativeShares: '1',
          cumulativeSharesExcludePercentage: '16.666666666666666666',
          cumulativeSharesIncludePercentage: '50',
          currentCommissionRate: '0.100000000000000000',
          currentShares: '2',
          currentTokens: '2',
          jailed: false,
          maxCommissionRate: '0.100000000000000000',
          securityContact: '',
          status: 'BOND_STATUS_BONDED',
          validatorAddress: 'operator_address_2',
          validatorName: '2',
          validatorWebSite: '',
          pubKey: {
            type: '/cosmos.crypto.ed25519.PubKey',
            value: 'consensus_pubkey_2',
          },
        },
        {
          cumulativeShares: '3',
          cumulativeSharesExcludePercentage: '50',
          cumulativeSharesIncludePercentage: '100',
          currentCommissionRate: '0.100000000000000000',
          currentShares: '3',
          currentTokens: '3',
          jailed: false,
          maxCommissionRate: '0.100000000000000000',
          securityContact: '',
          status: 'BOND_STATUS_BONDED',
          validatorAddress: 'operator_address_3',
          validatorName: '3',
          validatorWebSite: '',
          pubKey: {
            type: '/cosmos.crypto.ed25519.PubKey',
            value: 'consensus_pubkey_3',
          },
        },
      ]);
    });

    it('should keep bonded and unajiled validators only', async () => {
      const nodeRpcService: INodeRpcService = new NodeRpcService(null as any, axios.create());
      moxios.stubRequest('/validatorsets/latest', {
        status: 200,
        response: {
          height: '0',
          result: {
            block_height: '108500',
            validators: [
              {
                address: 'address_1',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_1',
                },
                proposer_priority: '1',
                voting_power: '1',
              },
              {
                address: 'address_2',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_2',
                },
                proposer_priority: '2',
                voting_power: '2',
              },
              {
                address: 'address_3',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_3',
                },
                proposer_priority: '3',
                voting_power: '3',
              },
            ],
          },
        },
      });
      moxios.stubRequest('/cosmos/staking/v1beta1/validators', {
        status: 200,
        response: {
          pagination: {
            next_key: null,
            total: '2',
          },
          validators: [
            {
              operator_address: 'unbonded_operator_address_1',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_1',
              },
              jailed: false,
              status: 'BOND_STATUS_UNBONDED',
              tokens: '1',
              delegator_shares: '1',
              description: {
                moniker: '1',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '1',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
            {
              operator_address: 'jailed_operator_address_2',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_2',
              },
              jailed: true,
              status: 'BOND_STATUS_BONDED',
              tokens: '2',
              delegator_shares: '2',
              description: {
                moniker: '2',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '2',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
            {
              operator_address: 'operator_address_3',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_3',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '3',
              delegator_shares: '3',
              description: {
                moniker: '3',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '3',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
          ],
        },
      });

      return expect(nodeRpcService.loadTopValidators()).to.eventually.deep.equal([
        {
          cumulativeShares: '0',
          cumulativeSharesExcludePercentage: '0',
          cumulativeSharesIncludePercentage: '100',
          currentCommissionRate: '0.100000000000000000',
          currentShares: '3',
          currentTokens: '3',
          jailed: false,
          maxCommissionRate: '0.100000000000000000',
          securityContact: '',
          status: 'BOND_STATUS_BONDED',
          validatorAddress: 'operator_address_3',
          validatorName: '3',
          validatorWebSite: '',
          pubKey: {
            type: '/cosmos.crypto.ed25519.PubKey',
            value: 'consensus_pubkey_3',
          },
        },
      ]);
    });

    it('should keep active validators only', async () => {
      const nodeRpcService: INodeRpcService = new NodeRpcService(null as any, axios.create());
      moxios.stubRequest('/validatorsets/latest', {
        status: 200,
        response: {
          height: '0',
          result: {
            block_height: '108500',
            validators: [
              {
                address: 'address_2',
                pub_key: {
                  type: 'tendermint/PubKeyEd25519',
                  value: 'consensus_pubkey_2',
                },
                proposer_priority: '2',
                voting_power: '2',
              },
            ],
          },
        },
      });
      moxios.stubRequest('/cosmos/staking/v1beta1/validators', {
        status: 200,
        response: {
          pagination: {
            next_key: null,
            total: '2',
          },
          validators: [
            {
              operator_address: 'operator_address_1',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_1',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '1',
              delegator_shares: '1',
              description: {
                moniker: '1',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '1',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
            {
              operator_address: 'active_operator_address_2',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_2',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '2',
              delegator_shares: '2',
              description: {
                moniker: '2',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '2',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
            {
              operator_address: 'operator_address_3',
              consensus_pubkey: {
                '@type': '/cosmos.crypto.ed25519.PubKey',
                key: 'consensus_pubkey_3',
              },
              jailed: false,
              status: 'BOND_STATUS_BONDED',
              tokens: '3',
              delegator_shares: '3',
              description: {
                moniker: '3',
                identity: '',
                website: '',
                security_contact: '',
                details: '',
              },
              unbonding_height: '3',
              unbonding_time: '2021-03-25T01:00:00.000000000Z',
              commission: {
                commission_rates: {
                  rate: '0.100000000000000000',
                  max_rate: '0.100000000000000000',
                  max_change_rate: '0.100000000000000000',
                },
                update_time: '2021-03-25T01:00:00.000000000Z',
              },
              min_self_delegation: '1',
            },
          ],
        },
      });

      return expect(nodeRpcService.loadTopValidators()).to.eventually.deep.equal([
        {
          cumulativeShares: '0',
          cumulativeSharesExcludePercentage: '0',
          cumulativeSharesIncludePercentage: '100',
          currentCommissionRate: '0.100000000000000000',
          currentShares: '2',
          currentTokens: '2',
          jailed: false,
          maxCommissionRate: '0.100000000000000000',
          securityContact: '',
          status: 'BOND_STATUS_BONDED',
          validatorAddress: 'active_operator_address_2',
          validatorName: '2',
          validatorWebSite: '',
          pubKey: {
            type: '/cosmos.crypto.ed25519.PubKey',
            value: 'consensus_pubkey_2',
          },
        },
      ]);
    });
  });

  it('loadTopValidators', async () => {
    const nodeRpcService: INodeRpcService = new MockNodeRpcService();

    const broadcastTransactionResult = await nodeRpcService.broadcastTransaction('');
    const sequenceNumber: number = await nodeRpcService.loadSequenceNumber(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
    );
    const accountNumber: number = await nodeRpcService.fetchAccountNumber(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
    );
    const balance: string = await nodeRpcService.loadAccountBalance(
      'tcro1l4gxejy8qxl3vxcxv7vpk4cqu8qhrz2nfxxr2p',
      'tcro',
    );

    expect(broadcastTransactionResult.transactionHash).to.eq(
      '5481CCE07ACEF891F701AFEDC746C3478DDFEBFE524F5161ED09BB396F045B46',
    );
    expect(sequenceNumber).to.eq(4);
    expect(accountNumber).to.eq(12);
    expect(balance).to.eq('3405200');
  });
});
