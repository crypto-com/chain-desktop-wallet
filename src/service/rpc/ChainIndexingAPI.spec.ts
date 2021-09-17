import 'mocha';
import chai, { expect } from 'chai';
import moxios from 'moxios';
import { ChainIndexingAPI } from './ChainIndexingAPI';
import { SECONDS_OF_YEAR } from '../../config/StaticConfig';

chai.use(require('chai-as-promised'));

describe('Testing ChainIndexingApi', () => {
  beforeEach(() => {
    moxios.install();
  });

  afterEach(() => {
    moxios.uninstall();
  });

  it('should return the total claimed rewards', async () => {
    const nodeRpcService = ChainIndexingAPI.init('https://crypto.org/explorer/api/v1');

    moxios.wait(() => {
      const request1 = moxios.requests.at(0);

      moxios.wait(() => {
        const request2 = moxios.requests.at(1);
        request2.respondWith({
          status: 200,
          response: {
            result: [
              {
                account: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
                blockHeight: 2242168,
                blockHash: '03B9BABD2D608301F81DA65636B146E8C93E05C2B4CC90C058BB0FA8395BAE36',
                blockTime: '2021-09-06T10:30:42.461578727Z',
                transactionHash: '51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6',
                success: true,
                messageIndex: 0,
                messageType: 'MsgWithdrawDelegatorReward',
                data: {
                  delegatorAddress: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
                  recipientAddress: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
                  name: 'MsgWithdrawDelegatorRewardCreated',
                  uuid: '3c41be84-56f4-4a45-a78a-712885d1da95',
                  amount: [
                    {
                      denom: 'basecro',
                      amount: '11436009702',
                    },
                  ],
                  txHash: '51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6',
                  msgName: 'MsgWithdrawDelegatorReward',
                  version: 1,
                  height: 2242168,
                  msgIndex: 0,
                  validatorAddress: 'crocncl1u5ryf5jwc2jhd9xyvmasfqzacxp03v8dcj8xry',
                },
              },
            ],
            pagination: {
              total_record: 2,
              total_page: 2,
              current_page: 2,
              limit: 1,
            },
          },
        });
      });

      request1.respondWith({
        status: 200,
        response: {
          result: [
            {
              account: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
              blockHeight: 2242168,
              blockHash: '03B9BABD2D608301F81DA65636B146E8C93E05C2B4CC90C058BB0FA8395BAE36',
              blockTime: '2021-09-06T10:30:42.461578727Z',
              transactionHash: '51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6',
              success: true,
              messageIndex: 0,
              messageType: 'MsgWithdrawDelegatorReward',
              data: {
                delegatorAddress: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
                recipientAddress: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
                name: 'MsgWithdrawDelegatorRewardCreated',
                uuid: '3c41be84-56f4-4a45-a78a-712885d1da95',
                amount: [
                  {
                    denom: 'basecro',
                    amount: '11436009702',
                  },
                ],
                txHash: '51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6',
                msgName: 'MsgWithdrawDelegatorReward',
                version: 1,
                height: 2242168,
                msgIndex: 0,
                validatorAddress: 'crocncl1u5ryf5jwc2jhd9xyvmasfqzacxp03v8dcj8xry',
              },
            },
          ],
          pagination: {
            total_record: 2,
            total_page: 2,
            current_page: 1,
            limit: 1,
          },
        },
      });
    });

    expect(
      await nodeRpcService.getTotalRewardsClaimedByAddress(
        'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
      ),
    ).to.equal('22872019404');
  });

  it('should return the total claimed rewards as ZERO in case no list is received', async () => {
    const nodeRpcService = ChainIndexingAPI.init('https://crypto.org/explorer/api/v1');
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200,
        response: {
          result: [],
          pagination: {
            total_record: 1,
            total_page: 1,
            current_page: 1,
            limit: 1,
          },
        },
      });
    });
    expect(
      await nodeRpcService.getTotalRewardsClaimedByAddress(
        'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
      ),
    ).to.equal('0');
  });
  it('should return estimated rewards for a user account, , apy = 10%, period = 12 Months', async () => {
    const nodeRpcService = ChainIndexingAPI.init('https://crypto.org/explorer/api/v1');
    moxios.wait(() => {
      const validatorListReq = moxios.requests.get('get', 'validators?limit=1000000');
      const accountInfoReq = moxios.requests.get(
        'get',
        'accounts/cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
      );

      validatorListReq.respondWith({
        status: 200,
        response: {
          result: [
            {
              operatorAddress: 'crocncl1sluuqshjwrttwr553feqpq0550qd9w9zegvdy0',
              consensusNodeAddress: 'crocnclcons1lyqp8arayle44enfjz5fgyw7axpyr6pd5gxzm8',
              initialDelegatorAddress: 'cro1sluuqshjwrttwr553feqpq0550qd9w9z690yxn',
              tendermintPubkey: '/ThO1kb7WoIcNXkF6QFbeTRwn3dG/Lwcb41rJiE7ZUM=',
              tendermintAddress: 'F90013F47D27F35AE66990A89411DEE98241E82D',
              status: 'Bonded',
              jailed: false,
              joinedAtBlockHeight: 0,
              power: '17073471821',
              moniker: 'Pegasus',
              identity: 'A296556FF603197C',
              website: 'https://crypto.org',
              securityContact: 'chain-security@crypto.org',
              details: 'Driving mass adoption of blockchain technology, powered by Bison Trails',
              commissionRate: '0.200000000000000000',
              commissionMaxRate: '0.200000000000000000',
              commissionMaxChangeRate: '0.100000000000000000',
              minSelfDelegation: '500000000000000',
              totalSignedBlock: 2270036,
              totalActiveBlock: 2270307,
              impreciseUpTime: '0.9998806329',
              votedGovProposal: 2,
              powerPercentage: '0.0481308173',
              cumulativePowerPercentage: '0.0481308173',
              apy: '0.1',
            },
          ],
          pagination: {
            total_record: 1,
            total_page: 1,
            current_page: 1,
            limit: 1,
          },
        },
      });

      accountInfoReq.respondWith({
        status: 200,
        response: {
          result: {
            type: '/cosmos.auth.v1beta1.BaseAccount',
            name: '',
            address: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
            balance: [
              {
                denom: 'basecro',
                amount: '6955702643',
              },
            ],
            bondedBalance: [
              {
                denom: 'basecro',
                amount: '10000',
              },
            ],
            redelegatingBalance: [],
            unbondingBalance: [
              {
                denom: 'basecro',
                amount: '50000000000',
              },
            ],
            totalRewards: [
              {
                denom: 'basecro',
                amount: '8051847300.119276460727110816',
              },
            ],
            commissions: [],
            totalBalance: [
              {
                denom: 'basecro',
                amount: '12937080862919.119276460727110816',
              },
            ],
          },
        },
      });
    });

    // 31536000/2 = 6 months, APY = 10%
    expect(
      JSON.stringify(
        await nodeRpcService.getFutureEstimatedRewardsByValidatorAddressList(
          ['crocncl1sluuqshjwrttwr553feqpq0550qd9w9zegvdy0'],
          SECONDS_OF_YEAR / 2,
          'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
        ),
      ),
    ).to.equal(
      JSON.stringify({
        estimatedRewards: '500.000000000000000000',
        estimatedApy: '0.1',
      }),
    );
  });
  it('should return estimated rewards for a user account, apy = 10%, period = 6 Months', async () => {
    const nodeRpcService = ChainIndexingAPI.init('https://crypto.org/explorer/api/v1');
    moxios.wait(() => {
      const validatorListReq = moxios.requests.get('get', 'validators?limit=1000000');
      const accountInfoReq = moxios.requests.get(
        'get',
        'accounts/cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
      );

      validatorListReq.respondWith({
        status: 200,
        response: {
          result: [
            {
              operatorAddress: 'crocncl1sluuqshjwrttwr553feqpq0550qd9w9zegvdy0',
              consensusNodeAddress: 'crocnclcons1lyqp8arayle44enfjz5fgyw7axpyr6pd5gxzm8',
              initialDelegatorAddress: 'cro1sluuqshjwrttwr553feqpq0550qd9w9z690yxn',
              tendermintPubkey: '/ThO1kb7WoIcNXkF6QFbeTRwn3dG/Lwcb41rJiE7ZUM=',
              tendermintAddress: 'F90013F47D27F35AE66990A89411DEE98241E82D',
              status: 'Bonded',
              jailed: false,
              joinedAtBlockHeight: 0,
              power: '17073471821',
              moniker: 'Pegasus',
              identity: 'A296556FF603197C',
              website: 'https://crypto.org',
              securityContact: 'chain-security@crypto.org',
              details: 'Driving mass adoption of blockchain technology, powered by Bison Trails',
              commissionRate: '0.200000000000000000',
              commissionMaxRate: '0.200000000000000000',
              commissionMaxChangeRate: '0.100000000000000000',
              minSelfDelegation: '500000000000000',
              totalSignedBlock: 2270036,
              totalActiveBlock: 2270307,
              impreciseUpTime: '0.9998806329',
              votedGovProposal: 2,
              powerPercentage: '0.0481308173',
              cumulativePowerPercentage: '0.0481308173',
              apy: '0.1',
            },
          ],
          pagination: {
            total_record: 1,
            total_page: 1,
            current_page: 1,
            limit: 1,
          },
        },
      });

      accountInfoReq.respondWith({
        status: 200,
        response: {
          result: {
            type: '/cosmos.auth.v1beta1.BaseAccount',
            name: '',
            address: 'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
            balance: [
              {
                denom: 'basecro',
                amount: '6955702643',
              },
            ],
            bondedBalance: [
              {
                denom: 'basecro',
                amount: '10000',
              },
            ],
            redelegatingBalance: [],
            unbondingBalance: [
              {
                denom: 'basecro',
                amount: '50000000000',
              },
            ],
            totalRewards: [
              {
                denom: 'basecro',
                amount: '8051847300.119276460727110816',
              },
            ],
            commissions: [],
            totalBalance: [
              {
                denom: 'basecro',
                amount: '12937080862919.119276460727110816',
              },
            ],
          },
        },
      });
    });

    // 31536000/2 = 6 months, APY = 10%
    expect(
      JSON.stringify(
        await nodeRpcService.getFutureEstimatedRewardsByValidatorAddressList(
          ['crocncl1sluuqshjwrttwr553feqpq0550qd9w9zegvdy0'],
          SECONDS_OF_YEAR / 2,
          'cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a',
        ),
      ),
    ).to.equal(
      JSON.stringify({
        estimatedRewards: '500.000000000000000000',
        estimatedApy: '0.1',
      }),
    );
  });
});
