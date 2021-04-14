import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import bech32 from 'bech32';

export class LedgerSigner {
  app: any;

  path: number[] | undefined;

  account: number;

  constructor(account: number = 0) {
    this.account = account;
  }

  // override this function
  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  async createTransport() {}

  // eslint-disable-next-line class-methods-use-this, @typescript-eslint/no-empty-function
  async closeTransport() {}

  public static toBech32(address: Uint8Array, bech32Prefix: string): string {
    const words = bech32.toWords(Buffer.from(address) as any);
    return bech32.encode(bech32Prefix, words);
  }

  public static fromBech32(bech32Addr: string, prefix?: string): Uint8Array {
    if (prefix === '') {
      throw new Error('Empty bech32 prefix');
    }

    const { prefix: b32Prefix, words } = bech32.decode(bech32Addr);

    if (prefix != null && b32Prefix !== prefix) {
      throw new Error("Prefix doesn't match");
    }
    const address = bech32.fromWords(words);

    return new Uint8Array(address);
  }

  /// add length
  /// pubKey: compressed 33 bytes
  /// encode: 33, pubKey:  34 bytes
  public static pubkeyToBytes(pubKey: Buffer): Uint8Array {
    const sizearray = Buffer.from([pubKey.length]);
    const totalarray = Buffer.concat([sizearray, pubKey]);
    return totalarray;
  }

  // tuple : address, pubkey
  public async enable(
    index: number,
    addressPrefix: string,
    showLedgerDisplay: boolean /* display address in ledger */,
  ): Promise<[string, Bytes]> {
    await this.createTransport();

    let response = await this.app.getVersion();
    if (response.error_message !== 'No errors') {
      await this.closeTransport();
      throw new Error(`${response.error_message}`);
    }

    // purpose(44), coin(394), account(0), change(0), index(0)
    // for string: `m/44'/394'/${this.account}'/0/${index}`;
    this.path = [44, 394, this.account, 0, index];

    if (showLedgerDisplay) {
      response = await this.app.showAddressAndPubKey(this.path, addressPrefix);
    } else {
      response = await this.app.getAddressAndPubKey(this.path, addressPrefix);
    }
    if (response.error_message !== 'No errors') {
      await this.closeTransport();
      throw new Error(`${response.error_message}`);
    }
    const pubkey = Bytes.fromUint8Array(LedgerSigner.pubkeyToBytes(response.compressed_pk));

    const ret: [string, Bytes] = [response.bech32_address, pubkey];
    await this.closeTransport();
    return ret;
  }

  public async sign(message: Bytes): Promise<Bytes> {
    await this.createTransport();

    if (!this.app || !this.path) {
      throw new Error('Not signed in');
    }

    const response = await this.app.sign(this.path, message.toUint8Array());
    if (response.error_message !== 'No errors') {
      await this.closeTransport();
      throw new Error(`${response.error_message}`);
    }

    // Ledger has encoded the sig in ASN1 DER format, but we need a 64-byte buffer of <r,s>
    // DER-encoded signature from Ledger:
    // 0 0x30: a header byte indicating a compound structure
    // 1 A 1-byte length descriptor for all what follows (ignore)
    // 2 0x02: a header byte indicating an integer
    // 3 A 1-byte length descriptor for the R value
    // 4 The R coordinate, as a big-endian integer
    //   0x02: a header byte indicating an integer
    //   A 1-byte length descriptor for the S value
    //   The S coordinate, as a big-endian integer
    //  = 7 bytes of overhead
    let { signature } = response;
    if (signature[0] !== 0x30) {
      await this.closeTransport();
      throw new Error('Ledger assertion failed: Expected a signature header of 0x30');
    }

    // decode DER string format
    let rOffset = 4;
    let rLen = signature[3];
    const sLen = signature[4 + rLen + 1]; // skip over following 0x02 type prefix for s
    let sOffset = signature.length - sLen;
    // we can safely ignore the first byte in the 33 bytes cases
    if (rLen === 33) {
      rOffset++; // chop off 0x00 padding
      rLen--;
    }
    if (sLen === 33) {
      sOffset++;
    } // as above
    const sigR = signature.slice(rOffset, rOffset + rLen); // skip e.g. 3045022100 and pad
    const sigS = signature.slice(sOffset);

    signature = Buffer.concat([sigR, sigS]);
    if (signature.length !== 64) {
      await this.closeTransport();
      throw new Error(`Ledger assertion failed: incorrect signature length ${signature.length}`);
    }
    const bytes = Bytes.fromUint8Array(new Uint8Array(signature));
    await this.closeTransport();
    return bytes;
  }
}
