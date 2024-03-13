import 'mocha';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { CronosClient } from './CronosClient';

describe('CronosClient', () => {
  let axiosMock: MockAdapter;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    axiosMock.reset();
  });
  it('should return the `txList` from chainIndexAPI ', async () => {
    const txListStub = {
      message: 'OK',
      result: [
        {
          blockHash: '0x12083dc618d64018911a30775e5ad8e95110666ffbcd51afe22f6ee3f4f31fba',
          blockNumber: '89998',
          confirmations: '82318',
          contractAddress: '',
          cumulativeGasUsed: '52380',
          from: '0x5a58b4d21720a96077ef0df280d73a26249f0784',
          gas: '72000',
          gasPrice: '100',
          gasUsed: '52380',
          hash: '0xc7d45697d4f2296964500a83ca3fbcc34f6d68ba58ed6b8ea4fe93363d6dd384',
          input:
            '0xa9059cbb000000000000000000000000899c7b2a8d62c3b848c052a16a4364a091eb308b0000000000000000000000000000000000000000000000000000102e294e53fd',
          isError: '0',
          nonce: '5995',
          timeStamp: '1627443473',
          to: '0x95f7c0b0def5ec981709c5c47e32963e5450bf38',
          transactionIndex: '0',
          txreceipt_status: '1',
          value: '0',
        },
        {
          blockHash: '0xeac5e5cb8e4f85c7b6b821c0ce73238cd47310a53c4c4dd0c02f8fe064ee35b7',
          blockNumber: '89995',
          confirmations: '82321',
          contractAddress: '',
          cumulativeGasUsed: '52380',
          from: '0x5a58b4d21720a96077ef0df280d73a26249f0784',
          gas: '72000',
          gasPrice: '100',
          gasUsed: '52380',
          hash: '0x0d0b8494850a0bf0c3758db4252666d4f825d4121c971fdcc388147777f1b8dd',
          input:
            '0xa9059cbb000000000000000000000000c45296515b7fafec0392bfea07a30cad837b07cb00000000000000000000000000000000000000000000000000002c2ef889a2ae',
          isError: '0',
          nonce: '5994',
          timeStamp: '1627443445',
          to: '0x95f7c0b0def5ec981709c5c47e32963e5450bf38',
          transactionIndex: '0',
          txreceipt_status: '1',
          value: '0',
        },
      ],
      status: '1',
    };
    axiosMock
      .onGet('', {
        params: {
          module: 'account',
          action: 'txlist',
          address: '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
          page: '1',
          offset: '2',
        },
      })
      .replyOnce(200, txListStub)
      .onGet()
      .reply(200, {
        message: 'No transactions found',
        result: [],
        status: '0',
      });

    const cronosClient = new CronosClient(
      'https://evm-t3.cronos.org:8545/',
      'https://cronos.org/explorer/testnet3/api',
    );

    const txListRespone = await cronosClient.getTxsByAddress(
      '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
      { page: '1', offset: '2' },
    );
    expect(txListRespone.message).to.equal('OK');
    expect(txListRespone.status).to.equal('1');
    expect(txListRespone.result).to.deep.equal(txListStub.result);

    const txListEmptyRespone = await cronosClient.getPendingTxsByAddress(
      '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
      { page: '1', offset: '2' },
    );
    expect(txListEmptyRespone.message).to.equal('No transactions found');
    expect(txListEmptyRespone.status).to.equal('0');
    expect(txListEmptyRespone.result).to.deep.equal([]);
  });

  it('should return the `pendingTxList` from chainIndexAPI ', async () => {
    const txPendingListStub = { message: 'No transactions found', result: [], status: '0' };
    axiosMock
      .onGet('', {
        params: {
          module: 'account',
          action: 'pendingtxlist',
          address: '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
          page: '1',
          offset: '2',
        },
      })
      .replyOnce(200, txPendingListStub)
      .onGet()
      .reply(200, {
        message: 'No transactions found',
        result: [],
        status: '0',
      });

    const cronosClient = new CronosClient(
      'https://evm-t3.cronos.org:8545/',
      'https://cronos.org/explorer/testnet3/api',
    );
    const txPendingListRespone = await cronosClient.getPendingTxsByAddress(
      '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
      { page: '1', offset: '2' },
    );
    expect(txPendingListRespone.message).to.equal('No transactions found');
    expect(txPendingListRespone.status).to.equal('0');
    expect(txPendingListRespone.result).to.deep.equal(txPendingListStub.result);

    const txPendingListEmptyRespone = await cronosClient.getPendingTxsByAddress(
      '0x95F7C0B0dEF5Ec981709c5C47E32963E5450bF38',
      { page: '1', offset: '2' },
    );
    expect(txPendingListEmptyRespone.message).to.equal('No transactions found');
    expect(txPendingListEmptyRespone.status).to.equal('0');
    expect(txPendingListEmptyRespone.result).to.deep.equal([]);
  });
});
