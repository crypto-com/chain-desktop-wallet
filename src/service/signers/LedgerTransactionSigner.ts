import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import sdk from '@crypto-com/chain-jslib';
import { Big, Units } from '../../utils/ChainJsLib';
import {
  FIXED_DEFAULT_FEE,
  FIXED_DEFAULT_GAS_LIMIT,
  WalletConfig,
} from '../../config/StaticConfig';
import {
  TransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
  UndelegateTransactionUnsigned,
  RedelegateTransactionUnsigned,
} from './TransactionSupported';
import { ISignerProvider } from './SignerProvider';
import { ITransactionSigner } from './TransactionSigner';

export class LedgerTransactionSigner implements ITransactionSigner {
  public readonly config: WalletConfig;

  public readonly signerProvider: ISignerProvider;

  public readonly addressIndex: number;

  constructor(config: WalletConfig, signerProvider: ISignerProvider, addressIndex: number) {
    this.config = config;
    this.signerProvider = signerProvider;
    this.addressIndex = addressIndex;
  }

  public getTransactionInfo(_phrase: string, transaction: TransactionUnsigned) {
    const cro = sdk.CroSDK({ network: this.config.network });
    const rawTx = new cro.RawTransaction();
    rawTx.setMemo(transaction.memo);

    const networkFee =
      this.config.fee !== undefined ? this.config.fee.networkFee : FIXED_DEFAULT_FEE;
    const gasLimit =
      this.config.fee !== undefined ? this.config.fee.gasLimit : FIXED_DEFAULT_GAS_LIMIT;

    const fee = new cro.Coin(networkFee, Units.BASE);

    rawTx.setFee(fee);
    rawTx.setGasLimit(gasLimit);
    return { cro, rawTx };
  }

  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgSend = new cro.bank.MsgSend({
      fromAddress: transaction.fromAddress,
      toAddress: transaction.toAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));
    const signableTx = rawTx
      .appendMessage(msgSend)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);
    const signature = await this.signerProvider.sign(bytesMessage);

    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public async signDelegateTx(
    transaction: DelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const delegateAmount = new cro.Coin(transaction.amount, Units.BASE);
    const msgDelegate = new cro.staking.MsgDelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: delegateAmount,
    });

    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));
    const signableTx = rawTx
      .appendMessage(msgDelegate)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);
    const signature = await this.signerProvider.sign(bytesMessage);

    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public async signWithdrawStakingRewardTx(
    transaction: WithdrawStakingRewardUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgWithdrawDelegatorReward = new cro.distribution.MsgWithdrawDelegatorReward({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
    });

    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));

    const signableTx = rawTx
      .appendMessage(msgWithdrawDelegatorReward)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);

    const signature = await this.signerProvider.sign(bytesMessage);
    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public async signUndelegateTx(
    transaction: UndelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgUndelegate = new cro.staking.MsgUndelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorAddress: transaction.validatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));

    const signableTx = rawTx
      .appendMessage(msgUndelegate)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);

    const signature = await this.signerProvider.sign(bytesMessage);
    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public async signRedelegateTx(
    transaction: RedelegateTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction);

    const msgBeginRedelegate = new cro.staking.MsgBeginRedelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorSrcAddress: transaction.sourceValidatorAddress,
      validatorDstAddress: transaction.destinationValidatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    const pubkeyoriginal = (
      await this.signerProvider.getPubKey(this.addressIndex, false)
    ).toUint8Array();
    const pubkey = Bytes.fromUint8Array(pubkeyoriginal.slice(1));

    const signableTx = rawTx
      .appendMessage(msgBeginRedelegate)
      .addSigner({
        publicKey: pubkey,
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
        signMode: 0, //   LEGACY_AMINO_JSON = 0, DIRECT = 1,
      })
      .toSignable();

    const bytesMessage: Bytes = signableTx.toSignDocument(0);

    const signature = await this.signerProvider.sign(bytesMessage);
    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }
}
