import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { SupportedChainName } from '../../config/StaticConfig';
import { DerivationPathStandard } from './LedgerSigner';
import { ISignerProvider } from './SignerProvider';

let electron: any;
if (window.require) {
  electron = window.require('electron');
}
export class IpcRender implements ISignerProvider {
  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  async getPubKey(
    index: number,
    chainName: SupportedChainName,
    derivationPathStandard: DerivationPathStandard,
    showLedgerDisplay: boolean,
  ): Promise<Bytes> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      addressPrefix: 'cro', // dummy value
      chainName,
      derivationPathStandard,
      showLedgerDisplay,
      message: 'enableWallet request for getPubKey',
    });
    if (!arg.success) {
      throw new Error(`getPubKey fail: ${arg.error}`);
    }
    const ret = Bytes.fromBuffer(Buffer.from(arg.pubKey));
    return ret;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  async getAddress(
    index: number,
    addressPrefix: string,
    chainName: SupportedChainName,
    derivationPathStandard: DerivationPathStandard,
    showLedgerDisplay: boolean,
  ): Promise<string> {
    const arg = electron.ipcRenderer.sendSync('enableWallet', {
      index,
      addressPrefix,
      chainName,
      derivationPathStandard,
      showLedgerDisplay,
      message: 'enableWallet request for getAddress',
    });
    if (!arg.success) {
      throw new Error(`get address fail: ${arg.error}`);
    }
    return arg.account;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  async getAddressList(
    startIndex: number,
    gap: number,
    addressPrefix: string,
    chainName: SupportedChainName,
    derivationPathStandard: DerivationPathStandard,
  ): Promise<string[]> {
    const arg = electron.ipcRenderer.sendSync('getAddressList', {
      startIndex,
      gap,
      addressPrefix,
      chainName,
      derivationPathStandard,
      message: 'enableWallet request for getAddressList',
    });
    if (!arg.success) {
      throw new Error(`get address fail: ${arg.error}`);
    }
    return arg.addressList;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  async sign(message: Bytes): Promise<Bytes> {
    const stringMessage = message.toBuffer().toString();
    const arg = electron.ipcRenderer.sendSync('signMessage', stringMessage);
    if (!arg.success) {
      throw new Error(`sign fail: ${arg.error}`);
    }

    return Bytes.fromBuffer(Buffer.from(arg.signed));
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  async ethSignSendTx(
    url: string = 'http://127.0.0.1:8545',
    index: number = 0,
    chainId: number = 9000,
    gasLimit: string = '0x5000',
    gasPrice: string = '0x0400000000',
    to: string,
    value: string = '0x00',
    data: string = '0x',
  ): Promise<string> {
    const a = {
      url,
      index,
      chainId,
      gasLimit,
      gasPrice,
      to,
      value,
      data,
    };

    const arg = electron.ipcRenderer.sendSync('ethSignSendTx', a);
    if (!arg.success) {
      throw new Error(`test fail: ${arg.error}`);
    }
    return arg.txhash;
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
    const a = {
      index,
      standard,
      chainId,
      nonce,
      gasLimit,
      gasPrice,

      to,
      value,
      data,
    };
    const arg = electron.ipcRenderer.sendSync('ethSignTx', a);
    if (!arg.success) {
      throw new Error(`test fail: ${arg.error}`);
    }
    return arg.signedtx;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  public async getEthAddress(
    index: number,
    standard: DerivationPathStandard,
    display: boolean,
  ): Promise<string> {
    const a = {
      index,
      standard,
      display,
    };
    const arg = electron.ipcRenderer.sendSync('ethGetAddress', a);
    if (!arg.success) {
      throw new Error(`test fail: ${arg.error}`);
    }
    return arg.address;
  }

  // eslint-disable-next-line  @typescript-eslint/no-unused-vars
  // eslint-disable-next-line  class-methods-use-this
  public async getEthAddressList(
    startIndex: number,
    gap: number,
    standard: DerivationPathStandard,
  ): Promise<string[]> {
    const a = {
      startIndex,
      gap,
      standard,
    };
    const arg = electron.ipcRenderer.sendSync('ethGetAddressList', a);
    if (!arg.success) {
      throw new Error(`test fail: ${arg.error}`);
    }
    return arg.addressList;
  }

  // eslint-disable-next-line class-methods-use-this
  public async signPersonalMessage(index: number, standard: DerivationPathStandard, message: string): Promise<string> {
    const ret = electron.ipcRenderer.sendSync('ethSignPersonalMessage', {
      message,
      index,
      standard
    });
    if (!ret.success) {
      throw new Error(`signPersonalMessage failed: ${ret.error}`);
    }

    return ret.sig;
  }

  // eslint-disable-next-line class-methods-use-this
  public async signTypedDataV4(index: number, standard: DerivationPathStandard, typedData: string): Promise<string> {
    const ret = electron.ipcRenderer.sendSync('ethSignTypedDataV4', { index, standard, typedData });
    if (!ret.success) {
      throw new Error(`signTypedDataV4 failed: ${ret.error}`);
    }

    return ret.sig;
  }
}
