import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { IpcRender } from './IpcRender';
import { ISignerProvider } from './SignerProvider';

export class LedgerWalletSignerProviderNative implements ISignerProvider {
  ipcRender: IpcRender;

  constructor() {
    this.ipcRender = new IpcRender();
  }

  public async getPubKey(index: number, showLedgerDisplay: boolean): Promise<Bytes> {
    const pubkey = await this.ipcRender.getPubKey(index, showLedgerDisplay);
    return pubkey;
  }

  public async getAddress(
    index: number,
    addressPrefix: string,
    showLedgerDisplay: boolean,
  ): Promise<string> {
    const address = await this.ipcRender.getAddress(index, addressPrefix, showLedgerDisplay);
    return address;
  }

  public async sign(message: Bytes): Promise<Bytes> {
    const signature = await this.ipcRender.sign(message);
    return signature;
  }
}
