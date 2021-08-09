import { Transaction } from 'ethereumjs-tx';
import { ethers } from 'ethers';
import { ITransactionSigner } from './TransactionSigner';
import {
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';

export class EvmTransactionSigner implements ITransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public signTransfer(transaction: TransferTransactionUnsigned, phrase: string): Promise<string> {
    const txParams = {
      nonce: ethers.utils.hexValue(transaction.nonce || 0),
      gasPrice: ethers.utils.hexValue(transaction.gasPrice || 0),
      gasLimit: transaction.gasLimit,
      to: transaction.toAddress,
      value: ethers.utils.parseEther(transaction.amount).toHexString(),
      data: '0x',
    };

    const tx = new Transaction(txParams);

    const { privateKey } = ethers.Wallet.fromMnemonic(phrase);
    tx.sign(Buffer.from(privateKey.replace('0x', ''), 'hex'));

    const signedTransactionHex = `0x${tx.serialize().toString('hex')}`;
    return Promise.resolve(signedTransactionHex);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  signDelegateTx(_: DelegateTransactionUnsigned, phrase: string): Promise<string> {
    return Promise.resolve('');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  signWithdrawStakingRewardTx(_: WithdrawStakingRewardUnsigned, phrase: string): Promise<string> {
    return Promise.resolve('');
  }
}
