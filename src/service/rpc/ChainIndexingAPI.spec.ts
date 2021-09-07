import 'mocha';
import chai, { expect } from 'chai';
import moxios from 'moxios';
import { ChainIndexingAPI } from './ChainIndexingAPI';

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
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200, response: {
          "result": [
            {
              "account": "cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a",
              "blockHeight": 2242168,
              "blockHash": "03B9BABD2D608301F81DA65636B146E8C93E05C2B4CC90C058BB0FA8395BAE36",
              "blockTime": "2021-09-06T10:30:42.461578727Z",
              "transactionHash": "51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6",
              "success": true,
              "messageIndex": 0,
              "messageType": "MsgWithdrawDelegatorReward",
              "data": {
                "delegatorAddress": "cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a",
                "recipientAddress": "cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a",
                "name": "MsgWithdrawDelegatorRewardCreated",
                "uuid": "3c41be84-56f4-4a45-a78a-712885d1da95",
                "amount": [
                  {
                    "denom": "basecro",
                    "amount": "11436009702"
                  }
                ],
                "txHash": "51CC8BB9A1ACFB4E8127CA4C1306EDF35CD3488BE3DDE6100B01E925742318C6",
                "msgName": "MsgWithdrawDelegatorReward",
                "version": 1,
                "height": 2242168,
                "msgIndex": 0,
                "validatorAddress": "crocncl1u5ryf5jwc2jhd9xyvmasfqzacxp03v8dcj8xry"
              }
            }
          ],
          "pagination": {
            "total_record": 129,
            "total_page": 129,
            "current_page": 1,
            "limit": 1
          }
        }
      }); //mocked response 
    })
    expect(await nodeRpcService.getTotalRewardsClaimedByAddress('cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a')).to.equal('11436009702');
  });

  it('should return the total claimed rewards as ZERO in case no list is received', async () => {
    const nodeRpcService = ChainIndexingAPI.init('https://crypto.org/explorer/api/v1');
    moxios.wait(() => {
      const request = moxios.requests.mostRecent();
      request.respondWith({
        status: 200, response: {
          "result": [],
          "pagination": {
            "total_record": 1,
            "total_page": 1,
            "current_page": 1,
            "limit": 1
          }
        }
      }); //mocked response 
    })
    expect(await nodeRpcService.getTotalRewardsClaimedByAddress('cro1gaf3jqqzvrxvgc4u4vr6x0tlf6kcm703zqa34a')).to.equal('0');
  });
});
