import sdk from '@crypto-com/chain-jslib';
import { Big, HDKey, Secp256k1KeyPair, Units } from '../types/ChainJsLib';
import { WalletConfig } from '../../config/StaticConfig';
import {
  TransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';

export interface ITransactionSigner {
  signTransfer(transaction: TransferTransactionUnsigned, phrase: string): Promise<string>;

  signDelegateTx(transaction: DelegateTransactionUnsigned, phrase: string): Promise<string>;

  signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string>;
}

export class TransactionSigner implements ITransactionSigner {
  public readonly config: WalletConfig;

  constructor(config: WalletConfig) {
    this.config = config;
  }

  public getTransactionInfo(phrase: string, transaction: TransactionUnsigned) {
    const cro = sdk.CroSDK({ network: this.config.network });

    const importedHDKey = HDKey.fromMnemonic(phrase);
    const privateKey = importedHDKey.derivePrivKey(this.config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);

    const rawTx = new cro.RawTransaction();
    rawTx.setMemo(transaction.memo);

    const fee = new cro.Coin('5000', Units.BASE);
    rawTx.setFee(fee);

    return { cro, keyPair, rawTx };
  }

  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    const signableTx = rawTx
      .appendMessage(msgSend)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    return signableTx
      .setSignature(0, keyPair.sign(signableTx.toSignDoc(0)))
      .toSigned()
      .getHexEncoded();
  }

  public async signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);
    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    const signableTx = rawTx
      .appendMessage(msgDelegate)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    return signableTx
      .setSignature(0, keyPair.sign(signableTx.toSignDoc(0)))
      .toSigned()
      .getHexEncoded();
  }

  public async signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, keyPair, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgWithdrawDelegatorReward = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    const signableTx = rawTx
      .appendMessage(msgWithdrawDelegatorReward)
      .addSigner({
        publicKey: keyPair.getPubKey(),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    return signableTx
      .setSignature(0, keyPair.sign(signableTx.toSignDoc(0)))
      .toSigned()
      .getHexEncoded();
  }
}
