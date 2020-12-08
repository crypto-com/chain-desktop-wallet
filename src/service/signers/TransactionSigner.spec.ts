import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import { TransactionSigner } from './TransactionSigner';

describe('Testing TransactionSigner', () => {
  it('test transaction signing ', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const phrase =
      'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone';

    const signer = new TransactionSigner(testNetConfig);

    const signedTransaferHex = signer.signTransfer(
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

    expect(signedTransaferHex).to.eq(
      '0a93010a90010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e6412700a2b7463726f313635747a63726832796c3833673871657178756567326735677a6775353779336665336b6333122b7463726f3138346c7461326c7379753437767779703265387a6d746361336b3579713835703663347670331a140a08626173657463726f1208313230303035303012580a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21030bf28c5f92c336db4703791691fa650fee408690b0a22c5ee4afb7e2508d32a712040a0208011802120410c09a0c1a4067678452c7370c1f0735c2e539fa3ca951eb687f3538182dbf0c4d64543c935326386110dbece44cb4e842a553511771af0176b4ff8565022ea2a749342df169',
    );
  });
});
