import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import sdk from '@crypto-com/chain-jslib';
import { Big, Units } from '../../utils/ChainJsLib';
import { WalletConfig, FIXED_DEFAULT_FEE } from '../../config/StaticConfig';
import {
  TransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
  UndelegateTransactionUnsigned,
  RedelegateTransactionUnsigned,
  CustomFeeRequest,
} from './TransactionSupported';
import { ISignerProvider } from './SignerProvider';
import { ITransactionSigner } from './TransactionSigner';

export class LedgerTransactionSigner implements ITransactionSigner {
  public readonly config: WalletConfig;

  public readonly signerProvider: ISignerProvider;

  constructor(config: WalletConfig, signerProvider: ISignerProvider) {
    this.config = config;
    this.signerProvider = signerProvider;
  }

  public getTransactionInfo(
    _phrase: string,
    transaction: TransactionUnsigned,
    customFeeRequest?: CustomFeeRequest,
  ) {
    this.setCustomFee(transaction);
    const cro = sdk.CroSDK({ network: this.config.network });
    const rawTx = new cro.RawTransaction();
    rawTx.setMemo(transaction.memo);

    if (transaction.fee) {
      const fee = new cro.Coin(transaction.fee, Units.BASE);
      const gasLimit = transaction.gasLimit as string;

      rawTx.setFee(fee);
      rawTx.setGasLimit(gasLimit);
    }

    // Custom transaction fees from a transaction type
    if (customFeeRequest) {
      const fee = new cro.Coin(customFeeRequest.fee, Units.BASE);
      const gasLimit = customFeeRequest.gasLimit as string;

      rawTx.setFee(fee);
      rawTx.setGasLimit(gasLimit);
    }

    return { cro, rawTx };
  }

  // eslint-disable-next-line class-methods-use-this
  public setCustomFee(transaction: TransactionUnsigned) {
    transaction.fee = `${FIXED_DEFAULT_FEE}`;
    return transaction;
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

    const pubkeyoriginal = await (await this.signerProvider.getPubKey(0, false)).toUint8Array();
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

    const pubkeyoriginal = await (await this.signerProvider.getPubKey(0, false)).toUint8Array();
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

    const pubkeyoriginal = await (await this.signerProvider.getPubKey(0, false)).toUint8Array();
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

    const pubkeyoriginal = await (await this.signerProvider.getPubKey(0, false)).toUint8Array();
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
    const customFeeRequest = { fee: '20000', gasLimit: '400000' };
    const { cro, rawTx } = this.getTransactionInfo(phrase, transaction, customFeeRequest);

    const msgBeginRedelegate = new cro.staking.MsgBeginRedelegate({
      delegatorAddress: transaction.delegatorAddress,
      validatorSrcAddress: transaction.sourceValidatorAddress,
      validatorDstAddress: transaction.destinationValidatorAddress,
      amount: new cro.Coin(transaction.amount, Units.BASE),
    });

    const pubkeyoriginal = await (await this.signerProvider.getPubKey(0, false)).toUint8Array();
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
