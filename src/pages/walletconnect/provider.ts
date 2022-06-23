import { EvmTransactionSigner } from '../../service/signers/EvmTransactionSigner';
import { Dapp, DappBrowserIPC } from '../dapp/types';

export const handleEvent = async (event: DappBrowserIPC.Event, mnemonic: string, onSuccess: (event: DappBrowserIPC.Event, result: string) => void) => {

  switch (event.name) {
    case 'signPersonalMessage':
      {
        const sig = await EvmTransactionSigner.signPersonalMessage(event.object.data, mnemonic);
        onSuccess(event, sig);
      }
      break;

    case 'signMessage':
      {
        const sig = await EvmTransactionSigner.signPersonalMessage(event.object.data, mnemonic);
        onSuccess(event, sig);
      }
      break;
  
    default:
      break;
  }
};
