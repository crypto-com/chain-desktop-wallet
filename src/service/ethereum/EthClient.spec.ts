/* eslint-disable */
import 'mocha';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { EthClient } from './EthClient';
import { successfulCallData, txListStubSuccessful, txListStubEmpty } from './test.data';

describe('EthClient', () => {
  let axiosMock: MockAdapter;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    axiosMock.reset();
  });
  it('should return transaction list from blockchain chainIndexAPI ', async () => {
    axiosMock
      .onGet('/address/0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a/normal', {
        params: { pageSize: 5, page: 0, sort: 'timestamp:desc' },
      })
      .replyOnce(200, txListStubSuccessful)
      .onGet('/address/0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a/normal', {
        params: { pageSize: 5, page: 1, sort: 'timestamp:desc' },
      })
      .replyOnce(200, txListStubEmpty);

    const ethClientApi = new EthClient(
      'https://eth-indexing.crypto.org/ethereum/mainnet/rpc',
      'https://eth-indexing.crypto.org/ethereum/mainnet/api/v1',
    );

    const txDataList = await ethClientApi.getTxsByAddress(
      '0xa976a66bfcbd5d71e6d0b7a0a3a9aa8eaa1b377a',
      { pageSize: 5, page: 0, sort: 'timestamp:desc' },
    );

    expect(txDataList).to.have.length(3);
    expect(txDataList[0].transaction_hash).to.equal(
      '0xf52854006893ba8c0575d7f5306a4648e084ae608fb81559a9f4cf82e6b674e9',
    );
    expect(txDataList[1].transaction_hash).to.equal(
      '0x12083dc618d64018911a30775e5ad8e95110666ffbcd51afe22f6ee3f4f31fba',
    );
  });
});
