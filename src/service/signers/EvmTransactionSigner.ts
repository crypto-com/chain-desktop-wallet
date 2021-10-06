import { ethers } from 'ethers';
import Web3 from 'web3';
import { ITransactionSigner } from './TransactionSigner';
import {
  BridgeTransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './TransactionSupported';

class EvmTransactionSigner implements ITransactionSigner {
  // eslint-disable-next-line class-methods-use-this
  public async signTransfer(
    transaction: TransferTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');
    const transferAsset = transaction.asset;

    const gasPriceBN = web3.utils.toBN(
      transaction.gasPrice || transferAsset?.config?.fee?.networkFee!,
    );

    const txParams = {
      nonce: web3.utils.toHex(transaction.nonce || 0),
      gasPrice: web3.utils.toHex(gasPriceBN),
      gasLimit: transaction.gasLimit || transferAsset?.config?.fee?.gasLimit,
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

  // eslint-disable-next-line class-methods-use-this
  public async signBridgeTransfer(
    transaction: BridgeTransactionUnsigned,
    phrase: string,
  ): Promise<string> {
    const web3 = new Web3('');

    const transferAsset = transaction.originAsset;

    const computedGasLimit = transaction.gasLimit || transferAsset?.config?.fee?.gasLimit;
    const minBridgeTxGasLimit = 200_000;
    const maxBridgeTxGasLimit = 600_000;

    const txParams = {
      nonce: web3.utils.toHex(transaction.nonce || 0),
      gasPrice: web3.utils.toHex(transaction.gasPrice || transferAsset?.config?.fee?.networkFee!),
      gasLimit: Math.min(
        Math.max(Number(computedGasLimit), minBridgeTxGasLimit),
        maxBridgeTxGasLimit,
      ),
      to: transaction.toAddress,
      value: web3.utils.toHex(transaction.amount),
      data: transaction.data,
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
