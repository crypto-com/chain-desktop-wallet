import sdk from '@crypto-com/chain-jslib';
import { Wallet } from '../models/Wallet';
import { WalletNetworkType } from './WalletNetworkType';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { HDKey, Secp256k1KeyPair } from './types/ChainJsLib';
import { encryptPhrase } from '../crypto/Encrypter';

// TODO : Complete WalletImporter implementation
export class WalletImporter {
  public static import(options: WalletImportOptions): Wallet {
    const network =
      options.networkType === WalletNetworkType.MAINNET
        ? sdk.CroNetwork.Mainnet
        : sdk.CroNetwork.Testnet;

    const cro = sdk.CroSDK({ network });

    const config =
      options.networkType === WalletNetworkType.MAINNET
        ? DefaultWalletConfigs.MainNetConfig
        : DefaultWalletConfigs.TestNetConfig;

    const privateKey = HDKey.fromMnemonic(options.phrase).derivePrivKey(config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    const address = new cro.Address(keyPair).account();

    const encryptedPhrase = encryptPhrase(options.phrase);
    return { address, config, encryptedPhrase };
  }

  public static importWithCustomConfigs(
    options: WalletImportOptions,
    customConfigs: WalletConfig,
  ): Wallet {
    // Generate address
    return { address: '', config: customConfigs, encryptedPhrase: '' };
  }
}

export class WalletImportOptions {
  public readonly networkType: WalletNetworkType;

  public readonly phrase: string;

  constructor(networkType: WalletNetworkType, phrase: string) {
    this.networkType = networkType;
    this.phrase = phrase;
  }
}
