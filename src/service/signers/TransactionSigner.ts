import sdk from '@crypto-com/chain-jslib';
import { HDKey, Secp256k1KeyPair, Units, Big } from '../types/ChainJsLib';
import { WalletConfig } from '../../config/StaticConfig';

export class TransactionSigner {
  public static sign(config: WalletConfig) {
    // Initialize the library configurations with TestNet configs
    const cro = sdk.CroSDK({ network: config.network });

    const importedHDKey = HDKey.fromMnemonic(
      'curtain maid fetch push pilot frozen speak motion island pigeon habit suffer gap purse royal hollow among orange pluck mutual eager cement void panther',
    );

    // Derive a private key from an HDKey at the specified path
    const privateKey = importedHDKey.derivePrivKey(config.derivationPath);

    // Getting a keyPair from a private key
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);

    // Init Raw transaction
    const rawTx = new cro.RawTransaction();

    const feeAmount = new cro.Coin('6500', Units.BASE);

    // Custom properties set
    rawTx.setMemo('Hello Test Memo');
    rawTx.setGasLimit('280000');
    rawTx.setFee(feeAmount);
    rawTx.setTimeOutHeight(341910);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: 'tcro165tzcrh2yl83g8qeqxueg2g5gzgu57y3fe3kc3',
      toAddress: 'tcro165tzcrh2yl83g8qeqxueg2g5gzgu57y3fe3kc3',
      amount: new cro.Coin('1210', Units.BASE),
    });

    const signableTx = rawTx
      .appendMessage(msgSend)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(41),
        accountSequence: new Big(13),
      })
      .toSignable();

    return signableTx.setSignature(0, keyPair.sign(signableTx.toSignDoc(0))).toSigned();
  }
}
