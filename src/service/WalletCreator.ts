import sdk from '@crypto-com/chain-jslib';
import { Wallet } from '../models/Wallet';
import { WalletImportOptions } from './WalletImporter';
import { WalletNetworkType } from './WalletNetworkType';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { HDKey, Secp256k1KeyPair } from './types/ChainJsLib';
import { encryptPhrase } from '../crypto/Encrypter';

export class WalletCreator {
  public static create(options: WalletCreateOptions): Wallet {
    const network =
      options.networkType === WalletNetworkType.MAINNET
        ? sdk.CroNetwork.Mainnet
        : sdk.CroNetwork.Testnet;

    const cro = sdk.CroSDK({ network });
    const phrase = HDKey.generateMnemonic(24);

    const config =
      options.networkType === WalletNetworkType.MAINNET
        ? DefaultWalletConfigs.MainNetConfig
        : DefaultWalletConfigs.TestNetConfig;

    const privateKey = HDKey.fromMnemonic(phrase).derivePrivKey(config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    const address = new cro.Address(keyPair).account();

    const encryptedPhrase = encryptPhrase(phrase);
    return { address, config, encryptedPhrase };
  }

  public static createWithCustomConfigs(
    options: WalletImportOptions,
    customConfigs: WalletConfig,
  ): Wallet {
    // TODO : Complete implementation for wallet creation with custom configs
    return { address: '', config: customConfigs, encryptedPhrase: '' };
  }
}

export class WalletCreateOptions {
  public readonly networkType: WalletNetworkType;

  constructor(networkType: WalletNetworkType) {
    this.networkType = networkType;
  }
}
