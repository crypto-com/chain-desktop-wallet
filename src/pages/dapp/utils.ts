import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { EVMChainConfig } from '../../models/Chain';
import { getGasPrice } from '../../service/evm/gas';
import { getNonce } from '../../service/evm/nonce';
import { EvmTransactionSigner, evmTransactionSigner } from '../../service/signers/EvmTransactionSigner';
import { EVMContractCallUnsigned } from '../../service/signers/TransactionSupported';
import { TransactionDataParser } from './browser/TransactionDataParser';
import { DappBrowserIPC } from './types';

export const fillInTransactionEventData = async (event: DappBrowserIPC.SendTransactionEvent | DappBrowserIPC.SignTransactionEvent, chainConfig: EVMChainConfig) => {
  const gasObject = await getGasPrice(chainConfig, {
    from: event.object.from,
    to: event.object.to,
    data: event.object.data,
    value: ethers.BigNumber.from(event.object.value ? event.object.value : 0),
  });

  event.object.gasPrice = event.object?.gasPrice ?? gasObject.gasPrice;
  event.object.gas = event.object?.gas ?? gasObject.gasLimit;
  event.object.maxFeePerGas = gasObject.maxFeePerGas;
  event.object.maxPriorityFeePerGas = gasObject.maxPriorityFeePerGas;

  event.object.chainConfig = chainConfig;

  if (event.object.data.startsWith('0x095ea7b3')) {
    const parsedData = await TransactionDataParser.parseTokenApprovalData(
      chainConfig,
      event.object.to,
      event.object.data,
    );
    const approvalEvent: DappBrowserIPC.TokenApprovalEvent = {
      name: 'tokenApproval',
      id: event.id,
      object: {
        tokenData: parsedData.tokenData,
        amount: parsedData.amount,
        spender: parsedData.spender,
        ...event.object,
      },
    };

    return approvalEvent;
  }

  return event;
};


interface SendTokenApprovalEventArgs {
  event: DappBrowserIPC.TokenApprovalEvent,
  mnemonic: string,
  _gasPrice: BigNumber,
  _gasLimit: BigNumber,
  onSuccess: ( result: string) => void,
  onError: ( error: string) => void,
}

export const sendTokenApprovalEvent = async (
  { event, mnemonic, _gasLimit, _gasPrice, onSuccess, onError }: SendTokenApprovalEventArgs
) => {
  const data = evmTransactionSigner.encodeTokenApprovalABI(
    event.object.spender,
    ethers.constants.MaxUint256,
  );

  const transaction: EVMContractCallUnsigned = {
    from: event.object.from,
    contractAddress: event.object.to,
    data,
    gasLimit: `0x${_gasLimit.toString(16)}`,
    gasPrice: `0x${_gasPrice.toString(16)}`,
    maxFeePerGas: event.object.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: event.object.maxPriorityFeePerGas ?? undefined,
    nonce: await getNonce(event.object.from, event.object.chainConfig),
  };
  try {
    const result = await EvmTransactionSigner.sendContractCallTransaction({
      chainConfig: event.object.chainConfig,
      transaction,
      mnemonic,
    });

    onSuccess(result);
  } catch (error) {
    onError('Token Approval Transaction failed');
  }
};

interface ISignTransactionEventArgs {
  event: DappBrowserIPC.SignTransactionEvent,
  mnemonic: string,
  _gasPrice: BigNumber,
  _gasLimit: BigNumber,
  onSuccess: (result: string) => void,
  onError: (error: string) => void
}

export const signTransactionEvent = async ({ event, mnemonic, _gasLimit, _gasPrice, onSuccess, onError }: ISignTransactionEventArgs) => {
  const transaction: EVMContractCallUnsigned = {
    contractAddress: event.object.to,
    data: event.object.data,
    from: event.object.from,
    gasLimit: `0x${_gasLimit.toString(16)}`,
    gasPrice: `0x${_gasPrice.toString(16)}`,
    maxFeePerGas: event.object.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: event.object.maxPriorityFeePerGas ?? undefined,
    nonce: await getNonce(event.object.from, event.object.chainConfig),
    value: event.object.value,
  };

  try {
    const result = await EvmTransactionSigner.sendContractCallTransaction({
      chainConfig: event.object.chainConfig,
      transaction,
      mnemonic,
    });
    onSuccess(result);
  } catch (error) {
    onError((error as any) as string);
  }
};

interface ISendTransactionEventArgs {
  event: DappBrowserIPC.SendTransactionEvent
  mnemonic: string
  _gasPrice: BigNumber
  _gasLimit: BigNumber
  onSuccess: (result: string) => void
  onError: (error: string) => void
}

export const sendTransactionEvent = async ({
  event,
  mnemonic,
  _gasPrice,
  _gasLimit,
  onSuccess,
  onError
}: ISendTransactionEventArgs) => {
  const transaction: EVMContractCallUnsigned = {
    contractAddress: event.object.to,
    data: event.object.data,
    from: event.object.from,
    gasLimit: `0x${_gasLimit.toString(16)}`,
    gasPrice: `0x${_gasPrice.toString(16)}`,
    maxFeePerGas: event.object.maxFeePerGas ?? undefined,
    maxPriorityFeePerGas: event.object.maxPriorityFeePerGas ?? undefined,
    nonce: await getNonce(event.object.from, event.object.chainConfig),
    value: event.object.value,
  };

  try {
    const result = await EvmTransactionSigner.sendContractCallTransaction({
      chainConfig: event.object.chainConfig,
      transaction,
      mnemonic,
    });
    onSuccess(result);
  } catch (error) {
    onError(error as any as string);
  }
};
