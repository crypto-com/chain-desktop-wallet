import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { ISignerProvider } from './SignerProvider';
import { LedgerSignerWebusb } from './LedgerSignerWebusb';

export class LedgerWalletSignerProviderWebusb implements ISignerProvider {
  provider: LedgerSignerWebusb;

  constructor() {
    this.provider = new LedgerSignerWebusb();
  }

  public async getPubKey(index: number, showLedgerDisplay: boolean): Promise<Bytes> {
    const result = await this.provider.enable(index, 'cro', showLedgerDisplay); // dummy value
    return result[1];
  }

  public async getAddress(
    index: number,
    addressPrefix: string,
    showLedgerDisplay: boolean,
  ): Promise<string> {
    const result = await this.provider.enable(index, addressPrefix, showLedgerDisplay);
    return result[0];
  }

  public async sign(message: Bytes): Promise<Bytes> {
    return this.provider.sign(message);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signEthTx(
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    index: number,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    chainId: number,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    nonce: number,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    gasLimit: string,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    gasPrice: string,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    to: string,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    value: string,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    data: string,
  ): Promise<string> {
    return '';
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async getEthAddress(_index: number, _display: boolean): Promise<string> {
    return '';
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signPersonalMessage(index: number, message: string): Promise<string> {
    throw new Error('not implemented');
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signTypedDataV4(index: number, typedData: string): Promise<string> {
    throw new Error('not implemented');
  }
}
