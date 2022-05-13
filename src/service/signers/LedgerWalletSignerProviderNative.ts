import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { IpcRender } from './IpcRender';
import { DerivationPathStandard } from './LedgerSigner';
import { ISignerProvider } from './SignerProvider';

export class LedgerWalletSignerProviderNative implements ISignerProvider {
  ipcRender: IpcRender;

  constructor() {
    this.ipcRender = new IpcRender();
  }

  public async getPubKey(index: number, derivationPathStandard: DerivationPathStandard, showLedgerDisplay: boolean): Promise<Bytes> {
    const pubkey = await this.ipcRender.getPubKey(index, derivationPathStandard, showLedgerDisplay);
    return pubkey;
  }

  public async getAddress(
    index: number,
    addressPrefix: string,
    derivationPathStandard: DerivationPathStandard,
    showLedgerDisplay: boolean,
  ): Promise<string> {
    const address = await this.ipcRender.getAddress(index, addressPrefix, derivationPathStandard, showLedgerDisplay);
    return address;
  }

  public async getAddressList(
    startIndex: number,
    gap: number,
    addressPrefix: string,
    derivationPathStandard: DerivationPathStandard,
  ): Promise<string[]> {
    const addressList = await this.ipcRender.getAddressList(startIndex, gap, addressPrefix, derivationPathStandard);
    return addressList;
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
    standard: DerivationPathStandard,
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
      standard,
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
  public async getEthAddress(index: number, standard: DerivationPathStandard, display: boolean): Promise<string> {
    const address = await this.ipcRender.getEthAddress(index, standard, display);
    return address;
  }

  public async getEthAddressList(startIndex: number, gap: number, standard: DerivationPathStandard): Promise<string[]> {
    const addressList = await this.ipcRender.getEthAddressList(startIndex, gap, standard);
    return addressList;
  }

  public async signTypedDataV4(index: number, standard: DerivationPathStandard, typedData: string): Promise<string> {
    const signature = await this.ipcRender.signTypedDataV4(index, standard, typedData);
    return signature;
  }

  public async signPersonalMessage(index: number, standard: DerivationPathStandard, message: string): Promise<string> {
    const signature = await this.ipcRender.signPersonalMessage(index, standard, message);
    return signature;
  }
}
