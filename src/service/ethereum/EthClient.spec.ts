import 'mocha';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { EthClient } from './EthClient';
import { successfulCallData } from './test.data';

describe('EthClient', () => {
  let axiosMock: MockAdapter;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    axiosMock.reset();
  });
  it('should return transaction list from blockchain chainIndexAPI ', async () => {
    const txListStub = {
      "data": {
        "0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a": {
          "address": {
            "type": "account",
            "contract_code_hex": null,
            "contract_created": null,
            "contract_destroyed": null,
            "balance": "1759674903173246059",
            "balance_usd": 4318.207018709339,
            "received_approximate": "5231187000000000000",
            "received_usd": 19647.0299,
            "spent_approximate": "2925965000000000000",
            "spent_usd": 10207.5973,
            "fees_approximate": "545547096826753941",
            "fees_usd": 1338.7616479182,
            "receiving_call_count": 19,
            "spending_call_count": 55,
            "call_count": 76,
            "transaction_count": 72,
            "first_seen_receiving": "2021-05-12 16:49:32",
            "last_seen_receiving": "2022-01-09 05:48:00",
            "first_seen_spending": "2021-05-12 18:55:22",
            "last_seen_spending": "2022-01-25 06:47:48",
            "nonce": null
          },
          "calls": successfulCallData
        }
      },
      "context": {
        "code": 200,
        "source": "D",
        "limit": "5,5",
        "offset": "1,1",
        "results": 1,
        "state": 14074856,
        "state_layer_2": 14074856,
        "market_price_usd": 2453.98,
        "cache": {
          "live": true,
          "duration": 180,
          "since": "2022-01-25 12:51:29",
          "until": "2022-01-25 12:54:29",
          "time": null
        },
        "api": {
          "version": "2.0.95-ie",
          "last_major_update": "2021-07-19 00:00:00",
          "next_major_update": null,
          "documentation": "https://blockchair.com/api/docs",
          "notice": ":)"
        },
        "servers": "API4,ETH3,ETH3",
        "time": 1.7783517837524414,
        "render_time": 0.0027332305908203125,
        "full_time": 1.7810850143432617,
        "request_cost": 1
      }
    };
    axiosMock
      .onGet('/address/0xA976A66BfcBd5d71E6d0B7A0A3A9AA8EAa1b377a', {
        params: {
          state: 'latest',
          limit: 5,
          offset: 1,
        },
      })
      .replyOnce(200, txListStub);

    const ethClientApi = new EthClient(
      'https://cronos-testnet-3.crypto.org:8545/',
      'https://cronos-chainindex.com',
    );

    const txListRespone = await ethClientApi.getTxsByAddress(
      '0xA976A66BfcBd5d71E6d0B7A0A3A9AA8EAa1b377a',
      {
        state: 'latest',
        limit: 5,
        offset: 1,
      },
    );

    expect(txListRespone.context.code).to.equal(200);
    expect(txListRespone.data).to.have.key("0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a");
    expect(txListRespone.data['0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a']).to.have.keys("address", "calls");
    expect(txListRespone.data['0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a']['calls']).to.deep.eq(successfulCallData);
    expect(txListRespone.data['0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a']['address'].call_count).to.eq(76);
  });
});
