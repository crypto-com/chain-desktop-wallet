import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { SupportedChainName } from '../../config/StaticConfig';
import { DerivationPathStandard } from './LedgerSigner';

export interface ISignerProvider {
  // cosmos
  getPubKey(index: number, chainName: SupportedChainName, derivationPathStandard: DerivationPathStandard, showLedgerDisplay: boolean): Promise<Bytes>;
  getAddress(index: number, addressPrefix: string, chainName: SupportedChainName, derivationPathStandard: DerivationPathStandard, showLedgerDisplay: boolean): Promise<string>;
  getAddressList(startIndex:number, gap: number, addressPrefix: string, chainName: SupportedChainName, derivationPathStandard: DerivationPathStandard): Promise<string[]>;
  sign(message: Bytes): Promise<Bytes>;

  // eth
  signEthTx(
    index: number,
    standard: DerivationPathStandard,
    chainId: number,
    nonce: number,
    gasLimit: string,
    gasPrice: string,
    to: string,
    value: string,
    data: string,
  ): Promise<string>;
  getEthAddress(index: number, standard: DerivationPathStandard, display: boolean): Promise<string>;
  getEthAddressList(startIndex:number, gap: number, standard: DerivationPathStandard): Promise<string[]>;
  signPersonalMessage(index: number, standard: DerivationPathStandard, message: string): Promise<string>;
  signTypedDataV4(index: number, standard: DerivationPathStandard, typedData: string): Promise<string>;
}
