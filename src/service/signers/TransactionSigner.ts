import sdk from '@crypto-com/chain-jslib';
import { Big, HDKey, Secp256k1KeyPair, Units } from '../types/ChainJsLib';
import { TransferTransaction } from './TransferTransaction';
import { WalletConfig } from '../../config/StaticConfig';

export class TransactionSigner {
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
  }

  public signTransfer(transfer: TransferTransaction, phrase: string): string {
    const cro = sdk.CroSDK({ network: this.config.network });

    const importedHDKey = HDKey.fromMnemonic(phrase);
    const privateKey = importedHDKey.derivePrivKey(this.config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);

    const rawTx = new cro.RawTransaction();

    rawTx.setMemo(transfer.memo);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transfer.fromAddress,
      toAddress: transfer.toAddress,
      amount: new cro.Coin(transfer.amount, Units.BASE),
    });

    const signableTx = rawTx
      .appendMessage(msgSend)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(transfer.accountNumber),
        accountSequence: new Big(transfer.accountSequence),
      })
      .toSignable();

    return signableTx
      .setSignature(0, keyPair.sign(signableTx.toSignDoc(0)))
      .toSigned()
      .getHexEncoded();
  }

  // public signDelegateTx() {}
}
