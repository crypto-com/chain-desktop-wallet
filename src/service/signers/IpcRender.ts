import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import { ISignerProvider } from './SignerProvider';

const electron = window.require('electron');

export class IpcRender implements ISignerProvider {
  async getPubKey(index: number): Promise<Bytes> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      message: 'enableWallet request for getPubKey',
    });
    const ret = Bytes.fromBuffer(Buffer.from(arg.pubKey));
    return ret;
  }

  async getAddress(index: number): Promise<string> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      message: 'enableWallet request for getAddress',
    });
    return arg.account;
  }

  async sign(message: Bytes): Promise<Bytes> {
    const stringMessage = message.toBuffer().toString();
    const arg = electron.ipcRenderer.sendSync('signMessage', stringMessage);
    return Bytes.fromBuffer(Buffer.from(arg.signed));
  }
}
