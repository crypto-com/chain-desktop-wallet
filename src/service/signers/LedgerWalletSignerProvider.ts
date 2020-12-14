import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import { IpcRender } from './IpcRender';
import { ISignerProvider } from './SignerProvider';

export class LedgerWalletSignerProvider implements ISignerProvider {
  ipcRender: IpcRender;
  constructor() {
    this.ipcRender = new IpcRender();
  }
  public async getPubKey(index: number): Promise<Bytes> {
    const pubkey = await this.ipcRender.getPubKey(index);
    return pubkey;
  }
  g;

  public async getAddress(index: number): Promise<string> {
    const address = await this.ipcRender.getAddress(index);
    return address;
  }

  public async sign(message: Bytes): Promise<Bytes> {
    const signature = await this.ipcRender.sign(message);
    return signature;
  }
}
