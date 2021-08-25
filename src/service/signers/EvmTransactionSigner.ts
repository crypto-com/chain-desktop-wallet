import { ethers } from 'ethers';
import Web3 from 'web3';
import { ITransactionSigner } from './TransactionSigner';
import {
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';

// TODO: To be removed, these will be part of the configuration
const DEFAULT_GAS_PRICE = 20_000_000_000; // 20 GWEI
const DEFAULT_GAS_LIMIT = 21_000; //

class EvmTransactionSigner implements ITransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');
    const txParams = {
      nonce: ethers.utils.hexValue(transaction.nonce || 0),
      gasPrice: ethers.utils.hexValue(transaction.gasPrice || DEFAULT_GAS_PRICE),
      gasLimit: transaction.gasLimit || DEFAULT_GAS_LIMIT,
      to: transaction.toAddress,
      value: web3.utils.toHex(transaction.amount),
      data:
        transaction.memo && transaction.memo.length > 0
          ? web3.utils.utf8ToHex(transaction.memo)
          : '0x',
      chainId: 338,
    };

    const signedTx = await ethers.Wallet.fromMnemonic(phrase).signTransaction(txParams);
    return Promise.resolve(signedTx);
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

export const evmTransactionSigner = new EvmTransactionSigner();
