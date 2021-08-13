import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, WalletConfig } from '../../config/StaticConfig';
import { TransactionSigner } from './TransactionSigner';
import { TransactionUnsigned } from './TransactionSupported';
import { evmTransactionSigner } from './EvmTransactionSigner';

const testNet = DefaultWalletConfigs.TestNetConfig;
// Overridden testnet chainId
const testNetConfig: WalletConfig = {
  ...testNet,
  network: {
    ...testNet.network,
    chainId: 'testnet-croeseid-1',
  },
  fee: {
    gasLimit: '200000',
    networkFee: '5000',
  },
};

class MockTransactionSigner extends TransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public setCustomFee(transaction: TransactionUnsigned) {
    /// Do nothing, returns same tx
    return transaction;
  }
}

describe('Testing TransactionSigner', () => {
  it('test transfer transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new MockTransactionSigner(testNetConfig);

    const signedTransferHex = await signer.signTransfer(
      {
        accountNumber: 0,
        accountSequence: 2,
        amount: '12000500',
        fromAddress: 'tcro165tzcrh2yl83g8qeqxueg2g5gzgu57y3fe3kc3',
        memo: '',
        toAddress: 'tcro184lta2lsyu47vwyp2e8zmtca3k5yq85p6c4vp3',
      },
      phrase,
    );

    expect(signedTransferHex).to.eq(
      '0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122b7463726f3138346c7461326c7379753437767779703265387a6d746361336b3579713835703663347670331a140a08626173657463726f12083132303030353030126a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a020801180212160a100a08626173657463726f12043530303010c09a0c1a404841993c91664747b3ba9419b1be02f43a6de55095ae206978f86cb3c6a96cf54383d063a1415aed1300f954743e4197bcacf78589b02e4a780e4ce5e57e0830',
    );
  });

  it('test delegate transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new MockTransactionSigner(testNetConfig);

    const signedDelegateTxHex = await signer.signDelegateTx(
      {
        accountNumber: 12,
        accountSequence: 0,
        amount: '12000500',
        memo: '',
        delegatorAddress: 'tcro165tzcrh2yl83g8qeqxueg2g5gzgu57y3fe3kc3',
        validatorAddress: 'tcrocncl1reyshfdygf7673xm9p8v0xvtd96m6cd6canhu3',
      },
      phrase,
    );

    expect(signedDelegateTxHex).to.eq(
      '0a9e010a9b010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c656761746512740a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122f7463726f636e636c317265797368666479676637363733786d39703876307876746439366d3663643663616e6875331a140a08626173657463726f12083132303030353030126a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a020801180012160a100a08626173657463726f12043530303010c09a0c1a40646a272b4370c961216a3eb3401da8b0a8d31dddaaf8e9f5843c89a4c12b50e817ae6081b04c1badf4b4fd4bc7f77024329415e4194cca66e3567576c6db2c56',
    );
  });

  it('test withdraw delegation reward transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new MockTransactionSigner(testNetConfig);

    const withdrawStakingRewardTxHex = await signer.signWithdrawStakingRewardTx(
      {
        accountNumber: 20,
        accountSequence: 1,
        memo: '',
        delegatorAddress: 'tcro165tzcrh2yl83g8qeqxueg2g5gzgu57y3fe3kc3',
        validatorAddress: 'tcrocncl1reyshfdygf7673xm9p8v0xvtd96m6cd6canhu3',
      },
      phrase,
    );

    expect(withdrawStakingRewardTxHex).to.eq(
      '0a9c010a99010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125e0a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122f7463726f636e636c317265797368666479676637363733786d39703876307876746439366d3663643663616e687533126a0a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a020801180112160a100a08626173657463726f12043530303010c09a0c1a40b0b4aa3a1f176c8e79b0ee64d3baab96ba7c6c6728a0dc42ed53372fb582fe7e6bcf320d5e61dc00d348dfecf1e62bad594bf73ab0b87539e399da48ece25246',
    );
  });

  it('test signing EVM transactions ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const transferTxSignedHex = await evmTransactionSigner.signTransfer(
      {
        amount: '345',
        fromAddress: '0xc2aFcEC3DAfAF1a4f47030eE35Fd1A1231C08256',
        gasLimit: 20_000,
        gasPrice: 5_000_000,
        nonce: 12,
        toAddress: '0x8875bF87684f46111dbc27725332CEA9C0f12D39',
        accountNumber: 0,
        accountSequence: 0,
        memo: '',
      },
      phrase,
    );

    expect(transferTxSignedHex).to.eq(
      '0xf8660c834c4b40824e20948875bf87684f46111dbc27725332cea9c0f12d39820159808202c7a0bff29ef22755a9b24de7415ce0096e3432639a9f43721364e9ed86b72e672583a04909c81e00403b06c6a1a692eedc1da87cb29fdd6622d7482ffb75c4c232fb04',
    );
  });
});
