import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { DerivationPathStandard } from './LedgerSigner';

export interface ISignerProvider {
  // cosmos
  getPubKey(index: number, showLedgerDisplay: boolean): Promise<Bytes>;
  getAddress(index: number, addressPrefix: string, showLedgerDisplay: boolean): Promise<string>;
  sign(message: Bytes): Promise<Bytes>;

  // eth
  signEthTx(
    index: number,
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
  signPersonalMessage(index: number, message: string): Promise<string>;
  signTypedDataV4(index: number, typedData: string): Promise<string>;
}
