import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';

import { ISignerProvider } from './SignerProvider';
import { message } from 'antd';
const electron = window.require('electron');

export class IpcRender implements ISignerProvider {
  signerAddress: string = '';
  signerPubKey: Bytes = Bytes.fromHexString('');

  constructor() {}

  async getPubKey(): Promise<Bytes> {
    let b = Bytes.fromHexString('');
    return b;
  }

  async sign(message: Bytes): Promise<Bytes> {
    var stringMessage = message.toBuffer().toString();
    var arg = electron.ipcRenderer.sendSync('signMessage', stringMessage);
    // from array to Buffer
    var returnBuffer = Buffer.from(arg.signed);
    var returnBytes = Bytes.fromBuffer(returnBuffer);
    return returnBytes;
  }
}
