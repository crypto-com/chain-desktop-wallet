import 'mocha';
import { expect } from 'chai';
import { IndexedTx } from '@cosmjs/stargate';
import { INodeRpcService } from './NodeRpcService';
import { BroadCastResult, StakingTransactionList } from '../../models/Transaction';

class MockNodeRpcService implements INodeRpcService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  fetchDelegationBalance(address: string, assetSymbol: string): Promise<StakingTransactionList> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  broadcastTransaction(signedTxHex: string): Promise<BroadCastResult> {
    return Promise.resolve({
      transactionHash: '5481CCE07ACEF891F701AFEDC746C3478DDFEBFE524F5161ED09BB396F045B46',
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  loadAccountBalance(address: string, assetDenom: string): Promise<string> {
    return Promise.resolve('3405200');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  fetchAccountNumber(address: string): Promise<number> {
    return Promise.resolve(12);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  loadSequenceNumber(address: string): Promise<number> {
    return Promise.resolve(4);
  }
}

describe('Testing NodeRpcService', () => {
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
});
