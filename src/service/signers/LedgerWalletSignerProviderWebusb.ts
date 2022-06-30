import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { ISignerProvider } from './SignerProvider';
import { LedgerSignerWebusb } from './LedgerSignerWebusb';
import { DerivationPathStandard } from './LedgerSigner';
import { SupportedChainName } from '../../config/StaticConfig';

export class LedgerWalletSignerProviderWebusb implements ISignerProvider {
  provider: LedgerSignerWebusb;

  constructor() {
    this.provider = new LedgerSignerWebusb();
  }

  public async getPubKey(index: number, chainName: SupportedChainName, derivationPathStandard: DerivationPathStandard, showLedgerDisplay: boolean): Promise<Bytes> {
    const result = await this.provider.enable(index, 'cro', chainName, derivationPathStandard, showLedgerDisplay); // dummy value
    return result[1];
  }

  public async getAddress(
    index: number,
    addressPrefix: string,
    chainName: SupportedChainName,
    derivationPathStandard: DerivationPathStandard,
    showLedgerDisplay: boolean,
  ): Promise<string> {
    const result = await this.provider.enable(index, addressPrefix, chainName, derivationPathStandard, showLedgerDisplay);
    return result[0];
  }

  public async getAddressList(
    startIndex: number,
    gap: number,
    addressPrefix: string,
    derivationPathStandard: DerivationPathStandard,
  ): Promise<string[]> {
    const result = await this.provider.getAddressList(startIndex, gap, addressPrefix, derivationPathStandard);
    return result;
  }

  public async sign(message: Bytes): Promise<Bytes> {
    return this.provider.sign(message);
  }

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signEthTx(
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    index: number,
    // eslint-disable-next-line  @typescript-eslint/no-unused-vars
    standard: DerivationPathStandard,
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
  public async getEthAddress(_index: number, _standard: DerivationPathStandard, _display: boolean): Promise<string> {
    return '';
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async getEthAddressList(_startIndex: number, _gap: number, _standard: DerivationPathStandard): Promise<string[]> {
    return [];
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signPersonalMessage(index: number, standard: DerivationPathStandard, message: string): Promise<string> {
    throw new Error('not implemented');
  }

  // eslint-disable-next-line  class-methods-use-this, @typescript-eslint/no-unused-vars
  public async signTypedDataV4(index: number, standard: DerivationPathStandard, typedData: string): Promise<string> {
    throw new Error('not implemented');
  }
}
