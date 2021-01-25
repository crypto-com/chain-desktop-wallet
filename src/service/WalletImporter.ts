import sdk from '@crypto-com/chain-jslib';
import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { HDKey, Secp256k1KeyPair } from '../utils/ChainJsLib';
import { getRandomId } from '../crypto/RandomGen';

export class WalletImporter {
  public static import(options: WalletImportOptions): Wallet {
    const cro = sdk.CroSDK({ network: options.config.network });

    const mnemonic = options.phrase;
    const privateKey = HDKey.fromMnemonic(mnemonic).derivePrivKey(options.config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    const address = new cro.Address(keyPair).account();

    return {
      identifier: getRandomId(),
      name: options.walletName,
      address,
      config: options.config,
      encryptedPhrase: mnemonic,
      hasBeenEncrypted: false,
      walletType: options.walletType,
    };
  }
}

export class WalletImportOptions {
  public readonly config: WalletConfig;

  public readonly walletName: string;

  public readonly phrase: string;

  public readonly walletType: string;

  constructor(walletName: string, walletConfig: WalletConfig, phrase: string, walletType: string) {
    this.walletName = walletName;
    this.config = walletConfig;
    this.phrase = phrase;
    this.walletType = walletType;
  }
}
