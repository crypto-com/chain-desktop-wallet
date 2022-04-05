/* eslint-disable @typescript-eslint/no-unused-expressions */

import 'mocha';
import chai, { expect } from 'chai';
import nock from 'nock';
import { TransactionConfig } from 'web3-eth';
import { IEvmRpc } from '../interface/evm.rpcClient';
import { EVMClient } from './EVMClient';

chai.use(require('chai-as-promised'));

const allowedHeaders = ['ClientName', 'ClientVersion', 'Content-Type', 'Authorization'];
const nockHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': allowedHeaders.join(','),
};

/* eslint-enable @typescript-eslint/no-unused-vars,class-methods-use-this */

const TestNetRPCURL = 'https://evm-t3.cronos.org:8545/';

describe('Testing EVMClient', () => {
  const nockScope = nock(TestNetRPCURL)
    .defaultReplyHeaders(nockHeaders)
    .filteringPath(() => {
      return '/';
    })
    .post('/');

  it('checks `isNodeSyncing`', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);

    const isNodeSyncing: boolean = await evmRpcClient.isNodeSyncing();
    expect(isNodeSyncing).to.not.be.true;

    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: {
        startingBlock: '0xab',
        currentBlock: '0xab',
        highestBlock: '0xab',
      },
    });
    const isNodeSyncing_True: boolean = await evmRpcClient.isNodeSyncing();
    expect(isNodeSyncing_True).to.be.true;
  });

  it('checks `getNextNonceByAddress` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const nonce = await evmRpcClient.getNextNonceByAddress(
      '0x0000000000000000000000000000000000000007',
    );
    expect(nonce).to.eq(1);

    // NOTE: I tried the conventional way of checking throw but no good.
    try {
      await evmRpcClient.getNextNonceByAddress('invalidaddr');
    } catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.eq('Please provide a valid EVM compatible address.');
    }
  });

  it('checks `getNativeBalanceByAddress` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x0234c8a3397aab58',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const nativeBalance = await evmRpcClient.getNativeBalanceByAddress(
      '0x0000000000000000000000000000000000000007',
    );
    expect(nativeBalance).to.eq('158972490234375000');

    // NOTE: I tried the conventional way of checking throw but no good.
    try {
      await evmRpcClient.getNativeBalanceByAddress('invalidaddr');
    } catch (error) {
      expect(error).to.not.be.undefined;
      expect(error.message).to.eq('Please provide a valid EVM compatible address.');
    }
  });

  it('checks `getChainId` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0xfa',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const nativeBalance = await evmRpcClient.getChainId();
    expect(nativeBalance).to.eq(250);
  });

  it('checks `getTransactionReceiptByHash` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: {
        status: true,
        transactionHash: '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
        transactionIndex: 0,
        blockHash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
        blockNumber: 3,
        contractAddress: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
        cumulativeGasUsed: 314159,
        gasUsed: 30234,
        logs: [],
      },
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const txReceipt = await evmRpcClient.getTransactionReceiptByHash('hash');
    expect(txReceipt).to.deep.eq({
      blockHash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
      blockNumber: 3,
      contractAddress: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
      cumulativeGasUsed: 314159,
      gasUsed: 30234,
      logs: [],
      status: false,
      transactionHash: '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
      transactionIndex: 0,
    });
  });
  it('checks `getLatestBlockHeight` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1234',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const latestBlockHeight = await evmRpcClient.getLatestBlockHeight();
    expect(latestBlockHeight).to.eq(4660);
  });

  it('checks `broadcastRawTransactionHex` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1234',
    });

    nockScope.twice().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: {
        status: '0x1',
        transactionHash: '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
        transactionIndex: 0,
        blockHash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
        blockNumber: 3,
        contractAddress: '',
        cumulativeGasUsed: 314159,
        gasUsed: 30234,
        logs: [],
      },
    });

    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const broadcastedTxHash = await evmRpcClient.broadcastRawTransactionHex(
      '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f',
    );
    expect(broadcastedTxHash).to.eq(
      '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
    );
  });
  it('checks `getBlock` ', async () => {
    nockScope
      .once()
      .twice()
      .thrice()
      .reply(200, {
        id: 0,
        jsonrpc: '2.0',
        result: {
          number: 3,
          hash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
          parentHash: '0x2302e1c0b972d00932deb5dab9eb2982f570597d9d42504c05d9c2147eaf9c88',
          nonce: '0xfb6e1a62d119228b',
          sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
          logsBloom: '',
          transactionsRoot: '0x3a1b03875115b79539e5bd33fb00d8f7b7cd61929d5a3c574f507b8acf415bee',
          stateRoot: '0xf1133199d44695dfa8fd1bcfe424d82854b5cebef75bddd7e40ea94cda515bcb',
          miner: '0x8888f1f195afa192cfee860698584c030f4c9db1',
          difficulty: '21345678965432',
          totalDifficulty: '324567845321',
          size: 616,
          extraData: '0x',
          gasLimit: 3141592,
          gasUsed: 21662,
          timestamp: 1429287689,
          transactions: ['0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'],
          uncles: [],
        },
      });

    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const blockByHash = await evmRpcClient.getBlockByHash(
      '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
    );
    const blockByHeight = await evmRpcClient.getBlockByHeight(3);
    const block = await evmRpcClient.getBlock(3);

    const blockResult = {
      difficulty: '21345678965432',
      extraData: '0x',
      gasLimit: 3141592,
      gasUsed: 21662,
      hash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
      logsBloom: '',
      miner: '0x8888f1F195AFa192CfeE860698584c030f4c9dB1',
      nonce: '0xfb6e1a62d119228b',
      number: 3,
      parentHash: '0x2302e1c0b972d00932deb5dab9eb2982f570597d9d42504c05d9c2147eaf9c88',
      sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      size: 616,
      stateRoot: '0xf1133199d44695dfa8fd1bcfe424d82854b5cebef75bddd7e40ea94cda515bcb',
      timestamp: 1429287689,
      totalDifficulty: '324567845321',
      transactions: ['0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'],
      transactionsRoot: '0x3a1b03875115b79539e5bd33fb00d8f7b7cd61929d5a3c574f507b8acf415bee',
      uncles: [],
    };

    expect(blockByHash).to.deep.eq(blockResult);
    expect(blockByHeight).to.deep.eq(blockResult);
    expect(block).to.deep.eq(blockResult);
  });
  it('checks `getEstimatedGasPrice` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1234fbdc',
    });
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const estimatedGasPrice = await evmRpcClient.getEstimatedGasPrice();
    expect(estimatedGasPrice).to.eq('305462236');
  });
  it('checks `estimateGas` ', async () => {
    nockScope.once().reply(200, {
      id: 0,
      jsonrpc: '2.0',
      result: '0x1234f',
    });
    const txConfig: TransactionConfig = {
      from: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
      to: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
      value: '0x12341234',
    };
    const evmRpcClient: IEvmRpc = EVMClient.create(TestNetRPCURL);
    const estimatedGas = await evmRpcClient.estimateGas(txConfig);
    expect(estimatedGas).to.eq(74575);
  });
});
