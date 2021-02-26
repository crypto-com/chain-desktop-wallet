import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';

export interface ISignerProvider {
  getPubKey(index: number, showLedgerDisplay: boolean): Promise<Bytes>;
  getAddress(index: number, addressPrefix: string, showLedgerDisplay: boolean): Promise<string>;
  sign(message: Bytes): Promise<Bytes>;
}
