import { Bytes } from '@crypto-com/chain-jslib/lib/dist/utils/bytes/bytes';
import { Secp256k1KeyPair } from '@crypto-com/chain-jslib/lib/dist/keypair/secp256k1';
import { PubKey, PubKeySecp256k1 } from '@chainapsis/cosmosjs/crypto';
import { AccAddress } from '@chainapsis/cosmosjs/common/address';
import { BIP44 } from '@chainapsis/cosmosjs/core/bip44';
import { HDKey } from '../types/ChainJsLib';
import { IpcRender } from './IpcRender';
const TransportWebUSB: any = require('@ledgerhq/hw-transport-webusb').default;
const TransportU2F: any = require('@ledgerhq/hw-transport-u2f').default;
/// const TransportHID: any = require('@ledgerhq/hw-transport-node-hid').default;
const CosmosApp: any = require('ledger-cosmos-js').default;

export interface ISignerProvider {
  /// Get array of keys that includes bech32 address string, address bytes and public key from wallet if user have approved the access.
  getPubKey(): Promise<Bytes>;

  /// Request signature from matched address if user have approved the access.
  sign(message: Bytes): Promise<Bytes>;
}

export class LocalWalletSignerProvider implements ISignerProvider {
  private keyPair: Secp256k1KeyPair;

  constructor(phrase: string, path: string) {
    const importedHDKey = HDKey.fromMnemonic(phrase);
    const privateKey = importedHDKey.derivePrivKey(path);
    this.keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
  }

  async getPubKey(): Promise<Bytes> {
    return this.keyPair.getPubKey();
  }

  async sign(message: Bytes): Promise<Bytes> {
    const result = this.keyPair.sign(message);
    return Promise.resolve(result);
  }
}

export class LedgerWalletSignerProvider implements ISignerProvider {
  ipcRender: IpcRender;
  constructor() {
    this.ipcRender = new IpcRender();
  }
  public async getPubKey(): Promise<Bytes> {
    let b = await this.ipcRender.getPubKey();
    return b;
  }

  public async sign(message: Bytes): Promise<Bytes> {
    let b = await this.ipcRender.sign(message);
    return b;
  }
}
