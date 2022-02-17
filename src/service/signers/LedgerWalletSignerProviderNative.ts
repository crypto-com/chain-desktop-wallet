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

  // eth
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  public async signEthTx(
    index: number,
    chainId: number,
    nonce: number,
    gasLimit: string,
    gasPrice: string,
    to: string,
    value: string,
    data: string,
  ): Promise<string> {
    const signedtx = await this.ipcRender.signEthTx(
      index,
      chainId,
      nonce,
      gasLimit,
      gasPrice,
      to,
      value,
      data,
    );
    return signedtx;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  public async getEthAddress(index: number, display: boolean): Promise<string> {
    const address = await this.ipcRender.getEthAddress(index, display);
    return address;
  }

  public async signTypedDataV4(index: number, typedData: string): Promise<string> {
    const signature = await this.ipcRender.signTypedDataV4(index, typedData);
    return signature;
  }

  public async signPersonalMessage(index: number, message: string): Promise<string> {
    const signature = await this.ipcRender.signPersonalMessage(index, message);
    return signature;
  }
}
