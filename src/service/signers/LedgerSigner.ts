import { Bytes } from '@crypto-org-chain/chain-jslib/lib/dist/utils/bytes/bytes';
import { bech32 } from 'bech32';
import { UserAssetType } from '../../models/UserAsset';

export enum DerivationPathStandard {
  BIP44 = 'bip-44',
  LEDGER_LIVE = 'ledger-live',
}

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
    derivationPathStandard: DerivationPathStandard,
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
    switch (derivationPathStandard) {
      case DerivationPathStandard.LEDGER_LIVE:
        this.path = [44, 394, index, 0, this.account];
        break;
      case DerivationPathStandard.BIP44:
      default:
        this.path = [44, 394, this.account, 0, index];
    }

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

  public async getAddressList(
    startIndex: number,
    gap: number,
    addressPrefix: string,
    derivationPathStandard: DerivationPathStandard,
  ): Promise<string[]> {
    const addressList: string[] = [];
    await this.createTransport();

    let response = await this.app.getVersion();
    if (response.error_message !== 'No errors') {
      await this.closeTransport();
      throw new Error(`${response.error_message}`);
    }

    for (let index = startIndex; index < startIndex + gap; index++) {
      // purpose(44), coin(394), account(0), change(0), index(0)
      // for string: `m/44'/394'/${this.account}'/0/${index}`;
      let path = [44, 394, this.account, 0, index];
      switch (derivationPathStandard) {
        case DerivationPathStandard.LEDGER_LIVE:
          path = [44, 394, index, 0, this.account];
          break;
        case DerivationPathStandard.BIP44:
        default:
          path = [44, 394, this.account, 0, index];
      }
      // eslint-disable-next-line no-await-in-loop
      response = await this.app.getAddressAndPubKey(path, addressPrefix);

      if (response.error_message !== 'No errors') {
        // eslint-disable-next-line no-await-in-loop
        await this.closeTransport();
        throw new Error(`${response.error_message}`);
      }

      addressList[index] = response.bech32_address;
    }

    await this.closeTransport();
    return addressList.filter(address => address !== undefined);
  }

  public static padZero(original_array: Uint8Array, wanted_length: number) {
    const new_array = new Uint8Array(wanted_length);
    for (let i = wanted_length - 1; i >= 0; i--) {
      const j = wanted_length - 1 - i;
      const new_i = original_array.length - 1 - j;
      if (new_i >= 0 && new_i < original_array.length) {
        new_array[i] = original_array[new_i];
      } else {
        new_array[i] = 0;
      }
    }

    return new_array;
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
    const rOffset = 4;
    const rLen = signature[3];
    const sLen = signature[4 + rLen + 1]; // skip over following 0x02 type prefix for s
    const sOffset = signature.length - sLen;

    const sigR = signature.slice(rOffset, rOffset + rLen); // skip e.g. 3045022100 and pad
    const sigS = signature.slice(sOffset);
    const newSigR = LedgerSigner.padZero(sigR, 32);
    const newSigS = LedgerSigner.padZero(sigS, 32);

    signature = Buffer.concat([newSigR, newSigS]);
    if (signature.length !== 64) {
      await this.closeTransport();
      throw new Error(`Ledger assertion failed: incorrect signature length ${signature.length}`);
    }
    const bytes = Bytes.fromUint8Array(new Uint8Array(signature));
    await this.closeTransport();
    return bytes;
  }

  // public getDerivativePath(path:{
  //   purpose?: number,
  //   coin?: number,
  //   account?: number,
  //   change?: number,
  //   index?: number,
  // }): string {
  //   const { purpose = 44, coin = 0, account = 0, change = 0, index = 0 } = path;
  //   return `44'/60'/${account}'/0/${index}`;
  // }

  public static getDerivationPath(
    index: number,
    assetType: UserAssetType,
    standard: DerivationPathStandard,
  ): string {
    let coin = '394';
    switch (assetType) {
      case UserAssetType.EVM:
        coin = '60';
        break;
      case UserAssetType.TENDERMINT:
      default:
        coin = '394';
    }
    switch (standard) {
      case DerivationPathStandard.LEDGER_LIVE:
        return `44'/${coin}'/${index}'/0/0`;
      case DerivationPathStandard.BIP44:
      default:
        return `44'/${coin}'/0'/0/${index}`;
    }
  }
}
