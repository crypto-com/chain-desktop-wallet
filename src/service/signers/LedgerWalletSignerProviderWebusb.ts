import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import { ISignerProvider } from './SignerProvider';
import { LedgerSignerWebusb } from './LedgerSignerWebusb';

export class LedgerWalletSignerProviderWebusb implements ISignerProvider {
  provider: LedgerSignerWebusb;

  constructor() {
    this.provider = new LedgerSignerWebusb();
  }

  public async getPubKey(index: number): Promise<Bytes> {
    const result = await this.provider.enable(index, 'cro'); // dummy value
    return result[1];
  }

  public async getAddress(index: number, addressPrefix: string): Promise<string> {
    const result = await this.provider.enable(index, addressPrefix);
    return result[0];
  }

  public async sign(message: Bytes): Promise<Bytes> {
    return this.provider.sign(message);
  }
}
