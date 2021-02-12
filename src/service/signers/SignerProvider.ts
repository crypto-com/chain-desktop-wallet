import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';

export interface ISignerProvider {
  getPubKey(index: number): Promise<Bytes>;
  getAddress(index: number, addressPrefix: string): Promise<string>;
  sign(message: Bytes): Promise<Bytes>;
}
