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
      .onGet('/address/0xA976A66BfcBd5d71E6d0B7A0A3A9AA8EAa1b377a', {
        params: { limit: 5, offset: 1, state: 'latest' },
      })
      .replyOnce(200, txListStubSuccessful)
      .onGet('/address/0xA976A66BfcBd5d71E6d0B7A0A3A9AA8EAa1b377a', {
        params: { limit: 5, offset: 2, state: 'latest' },
      })
      .replyOnce(200, txListStubEmpty);

    const ethClientApi = new EthClient(
      'https://cronos-testnet-3.crypto.org:8545/',
      'https://cronos-chainindex.com',
    );

    const txDataList = await ethClientApi.getTxsByAddress(
      '0xA976A66BfcBd5d71E6d0B7A0A3A9AA8EAa1b377a',
      {
        state: 'latest',
        limit: 5,
        offset: 1,
      },
    );

    expect(txDataList).to.have.length(5);
    expect(txDataList[0].transaction_hash).to.equal("0x1dd8de0c72b24e27b36d8a931414574ce3bf18b2d62c850fcf06d935143359a9");
    expect(txDataList[1].transaction_hash).to.equal("0xe4a8ba34c02991fe4f70598613e9798d78a88b343d41aa6e34a1f33d2d735ebb");
  });
});
