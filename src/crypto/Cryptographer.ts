import scrypt from 'scrypt-js';
import { utils } from '@crypto-org-chain/chain-jslib';
import { AES, enc, lib, mode, pad } from 'crypto-js';
import { EncryptionResult, HashResult, InitialVector } from '../models/SecretStorage';

class Cryptographer {
  // Cpu cost
  private readonly N = 2048;

  // Memory cost
  private readonly r = 8;

  // Parallelization cost
  private readonly p = 1;

  // Generated hash length in bytes
  private readonly dkLen = 64;

  private readonly saltLen = 64;

  private readonly ivLen = 24;

  private readonly cypherOptions = {
    mode: mode.CTR,
    padding: pad.Pkcs7,
  };

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
    return { data: output, salt };
  }

  public async generateIV(): Promise<InitialVector> {
    const wordArray = lib.WordArray.random(this.ivLen);
    return {
      words: wordArray.words,
      sigBytes: wordArray.sigBytes,
    };
  }

  public async encrypt(data: string, key: string, iv: InitialVector): Promise<EncryptionResult> {
    const ivWordArray = lib.WordArray.create(iv.words, iv.sigBytes);
    const cipher = AES.encrypt(data, key, {
      ...this.cypherOptions,
      iv: ivWordArray,
    }).toString();
    return {
      cipher,
      iv,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public async decrypt(ciphertext: string, key: string, iv: InitialVector): Promise<string> {
    const ivWordArray = lib.WordArray.create(iv.words, iv.sigBytes);
    return AES.decrypt(ciphertext, key, {
      ...this.cypherOptions,
      iv: ivWordArray,
    }).toString(enc.Utf8);
  }

  public generateSalt(): string {
    return lib.WordArray.random(this.saltLen).toString();
  }
}

export const cryptographer = new Cryptographer();
