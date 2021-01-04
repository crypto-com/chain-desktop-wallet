import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, WalletConfig } from '../../config/StaticConfig';
import { TransactionSigner } from './TransactionSigner';

const testNet = DefaultWalletConfigs.TestNetConfig;
// Overridden testnet chainId
const testNetConfig: WalletConfig = {
  ...testNet,
  network: {
    ...testNet.network,
    chainId: 'testnet-croeseid-1',
  },
};

describe('Testing TransactionSigner', () => {
  it('test transfer transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new TransactionSigner(testNetConfig);

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
      '0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122b7463726f3138346c7461326c7379753437767779703265387a6d746361336b3579713835703663347670331a140a08626173657463726f1208313230303035303012580a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a0208011802120410c09a0c1a4067678452c7370c1f0735c2e539fa3ca951eb687f3538182dbf0c4d64543c935326386110dbece44cb4e842a553511771af0176b4ff8565022ea2a749342df169',
    );
  });

  it('test delegate transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new TransactionSigner(testNetConfig);

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
      '0a9e010a9b010a232f636f736d6f732e7374616b696e672e763162657461312e4d736744656c656761746512740a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122f7463726f636e636c317265797368666479676637363733786d39703876307876746439366d3663643663616e6875331a140a08626173657463726f1208313230303035303012580a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a0208011800120410c09a0c1a4073bb0931edb3a0f06dde68e7e5ac5c07c55d47dd9145e719fd2683ac15799cce6042ba2ebe5a90ff79e6d294cd61d47034adf792c00f3fd100477166b5bf1873',
    );
  });

  it('test withdraw delegation reward transaction signing ', async () => {
    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new TransactionSigner(testNetConfig);

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
      '0a9c010a99010a372f636f736d6f732e646973747269627574696f6e2e763162657461312e4d7367576974686472617744656c656761746f72526577617264125e0a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122f7463726f636e636c317265797368666479676637363733786d39703876307876746439366d3663643663616e68753312580a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a0208011801120410c09a0c1a40822f12e93bb528965c87db030733f0c7c6228e46fe18a64d11c77169e6af23135455d07842b4101b0f3e13c94a9ab90d1c3e23b461573b4b19afd49bf69a4d03',
    );
  });
});
