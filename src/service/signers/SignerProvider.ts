import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';

export interface ISignerProvider {
  getPubKey(index: number): Promise<Bytes>;
  getAddress(index: number): Promise<string>;
  sign(message: Bytes): Promise<Bytes>;
}
