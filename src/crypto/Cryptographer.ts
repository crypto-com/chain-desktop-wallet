import scrypt from 'scrypt-js';
import { utils } from '@crypto-com/chain-jslib';
import { AES, enc, lib } from 'crypto-js';

export interface HashResult {
  data: string;
}

class Cryptographer {
  // Cpu cost
  private readonly N = 2048;

  // Memory cost
  private readonly r = 8;

  // Parallelization cost
  private readonly p = 1;

  // Generated hash length in bytes
  private readonly dkLen = 64;

  private readonly SALT_BYTE_LENGTH = 64;

  public computeHash(data: string, salt: string): HashResult {
    const normalizedData: string = data.normalize();
    const saltNormalized = salt.normalize();

    const encoding = 'utf-8';
    const dataBuffer: Buffer = Buffer.from(normalizedData, encoding);
    const saltBuffer: Buffer = Buffer.from(saltNormalized);

    const key: Uint8Array = scrypt.syncScrypt(
      dataBuffer,
      saltBuffer,
      this.N,
      this.r,
      this.p,
      this.dkLen,
    );
    const output = utils.Bytes.fromUint8Array(key).toHexString();

    // console.log(`Salt: ${saltNormalized} | data: ${normalizedData} | Derived: ${output}`);

    return { data: output };
  }

  // eslint-disable-next-line class-methods-use-this
  public encrypt(data: string, key: string) {
    return AES.encrypt(data, key).toString();
  }

  // eslint-disable-next-line class-methods-use-this
  public decrypt(ciphertext: string, key: string) {
    return AES.decrypt(ciphertext, key).toString(enc.Utf8);
  }

  public generateSalt(): string {
    return lib.WordArray.random(this.SALT_BYTE_LENGTH).toString();
  }
}

export const cryptographer = new Cryptographer();
