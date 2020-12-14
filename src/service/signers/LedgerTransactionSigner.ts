import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';

import sdk from '@crypto-com/chain-jslib';
import { Big, Units } from '../types/ChainJsLib';
import { WalletConfig } from '../../config/StaticConfig';
import {
  TransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';
import { ISignerProvider } from './SignerProvider';
import { ITransactionSigner } from './TransactionSigner';

function convertFromObjectToBytes(rawMessage: any): Bytes {
  const stringMessage = JSON.stringify(rawMessage);
  const bufferMessage = Buffer.from(stringMessage);
  const bytesMessage = Bytes.fromBuffer(bufferMessage);
  return bytesMessage;
}

export class LedgerTransactionSigner implements ITransactionSigner {
  public readonly config: WalletConfig;

  public readonly signerProvider: ISignerProvider;

  fee: string;
  gas: string;

  constructor(config: WalletConfig, signerProvider: ISignerProvider) {
    this.config = config;
    this.signerProvider = signerProvider;
    this.fee = '0';
    this.gas = '2000000';
  }

  public getTransactionInfo(phrase: string, transaction: TransactionUnsigned) {
    const cro = sdk.CroSDK({ network: this.config.network });
    const rawTx = new cro.RawTransaction();
    rawTx.setMemo(transaction.memo);

    if (transaction.fee) {
      const fee = new cro.Coin(transaction.fee, Units.BASE);
      this.fee = transaction.fee;
      rawTx.setFee(fee);
    }

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

    const signableTx = rawTx
      .appendMessage(msgSend)
      .addSigner({
        publicKey: await this.signerProvider.getPubKey(0),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    const fee = { amount: [{ amount: this.fee, denom: Units.BASE }], gas: this.gas };
    const value = {
      amount: { amount: transaction.amount, denom: Units.BASE },
      from_address: transaction.fromAddress,
      to_address: transaction.toAddress,
    };
    const msg = { type: 'cosmos-sdk/MsgWithdrawDelegatorReward', value };

    const rawMessage = {
      account_number: transaction.accountNumber.toString(),
      chain_id: this.config.network.chainId,
      fee,
      memo: '',
      msgs: [msg],
      sequence: transaction.accountSequence,
    };
    const bytesMessage = convertFromObjectToBytes(rawMessage);
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

    const signableTx = rawTx
      .appendMessage(msgDelegate)
      .addSigner({
        publicKey: await this.signerProvider.getPubKey(0),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    const fee = { amount: [{ amount: this.fee, denom: Units.BASE }], gas: this.gas };
    const value = {
      amount: { amount: transaction.amount, denom: Units.BASE },
      delegator_address: transaction.delegatorAddress,
      validator_address: transaction.validatorAddress,
    };
    const msg = { type: 'cosmos-sdk/MsgDelegate', value };

    const rawMessage = {
      account_number: transaction.accountNumber.toString(),
      chain_id: this.config.network.chainId,
      fee,
      memo: '',
      msgs: [msg],
      sequence: transaction.accountSequence,
    };

    const bytesMessage = convertFromObjectToBytes(rawMessage);

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

    const signableTx = rawTx
      .appendMessage(msgWithdrawDelegatorReward)
      .addSigner({
        publicKey: await this.signerProvider.getPubKey(0),
        accountNumber: new Big(transaction.accountNumber),
        accountSequence: new Big(transaction.accountSequence),
      })
      .toSignable();

    const fee = { amount: [{ amount: this.fee, denom: Units.BASE }], gas: this.gas };
    const value = {
      delegator_address: transaction.delegatorAddress,
      validator_address: transaction.validatorAddress,
    };
    const msg = { type: 'cosmos-sdk/MsgWithdrawDelegatorReward', value };

    const rawMessage = {
      account_number: transaction.accountNumber.toString(),
      chain_id: this.config.network.chainId,
      fee,
      memo: '',
      msgs: [msg],
      sequence: transaction.accountSequence,
    };
    const bytesMessage = convertFromObjectToBytes(rawMessage);

    const signature = await this.signerProvider.sign(bytesMessage);
    return signableTx
      .setSignature(0, signature)
      .toSigned()
      .getHexEncoded();
  }

  public test() {}
}
