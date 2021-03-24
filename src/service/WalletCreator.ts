import sdk from '@crypto-com/chain-jslib';
import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { HDKey, Secp256k1KeyPair } from '../utils/ChainJsLib';
import { getRandomId } from '../crypto/RandomGen';

export class WalletCreator {
  public static create(options: WalletCreateOptions): Wallet {
    const { address, encryptedPhrase } = this.generate(options);
    return {
      identifier: getRandomId(),
      name: options.walletName,
      address,
      config: options.config,
      encryptedPhrase,
      hasBeenEncrypted: false,
      walletType: options.walletType,
      addressIndex: options.addressIndex,
    };
  }

  private static generate(options: WalletCreateOptions) {
    const cro = sdk.CroSDK({ network: options.config.network });
    const phrase = HDKey.generateMnemonic(24);

    const privateKey = HDKey.fromMnemonic(phrase).derivePrivKey(options.config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    const address = new cro.Address(keyPair).account();

    return { address, encryptedPhrase: phrase };
  }
}

export class WalletCreateOptions {
  public readonly config: WalletConfig;

  public readonly walletName: string;

  public readonly walletType: string;

  public readonly addressIndex: number;

  constructor(
    walletConfig: WalletConfig,
    walletName: string,
    walletType: string,
    addressIndex: number,
  ) {
    this.config = walletConfig;
    this.walletName = walletName;
    this.walletType = walletType;
    this.addressIndex = addressIndex;
  }
}
