import BigNumber from 'bignumber.js';
import { EvmTransactionSigner } from '../../service/signers/EvmTransactionSigner';
import { DappBrowserIPC } from '../dapp/types';
import { sendTokenApprovalEvent, sendTransactionEvent, signTransactionEvent } from '../dapp/utils';

interface EventInfo {
  event: DappBrowserIPC.Event;
  mnemonic: string;
  gasLimit: BigNumber,
  gasPrice: BigNumber,
  onSuccess: (result: string) => void
  onError: (error: string) => void
}

export const handleEvent = async ({ event, mnemonic, gasLimit: _gasLimit, gasPrice: _gasPrice, onSuccess, onError }: EventInfo) => {

  switch (event.name) {
    case 'signPersonalMessage':
      {
        const sig = await EvmTransactionSigner.signPersonalMessage(event.object.data, mnemonic);
        onSuccess(sig);
      }
      break;

    case 'signMessage':
      {
        const sig = await EvmTransactionSigner.signPersonalMessage(event.object.data, mnemonic);
        onSuccess(sig);
      }
      break;

    case 'signTypedMessage':
      {
        const sig = await EvmTransactionSigner.signTypedDataV4(event.object.raw, mnemonic);
        onSuccess(sig);
      }
      break;

    case 'tokenApproval': {
      await sendTokenApprovalEvent({ event, mnemonic,_gasLimit, _gasPrice, onSuccess, onError });
    }
      break;

    case 'sendTransaction': {
      await sendTransactionEvent({ event, mnemonic, _gasLimit, _gasPrice, onSuccess, onError });
    }
      break;

    case 'signTransaction': {
      await signTransactionEvent({ event, mnemonic, _gasLimit, _gasPrice, onSuccess, onError });
    }
      break;
  
    default:
      break;
  }
};
