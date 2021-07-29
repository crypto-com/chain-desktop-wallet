import sdk from '@crypto-org-chain/chain-jslib';
import { ethers } from 'ethers';
import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { HDKey, Secp256k1KeyPair } from '../utils/ChainJsLib';
import { getRandomId } from '../crypto/RandomGen';
import { UserAsset } from '../models/UserAsset';
import { CRO_ASSET, CRONOS_ASSET } from '../config/StaticAssets';

export class WalletCreator {
  public static create(options: WalletCreateOptions): Wallet {
    const walletIdentifier = getRandomId();
    const { initialAssets, encryptedPhrase } = this.generate(options, walletIdentifier);
    return {
      identifier: walletIdentifier,
      name: options.walletName,
      // This global wallet address is now obsolete
      address: '',
      config: options.config,
      encryptedPhrase,
      hasBeenEncrypted: false,
      walletType: options.walletType,
      addressIndex: options.addressIndex,
      assets: initialAssets,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static generateAssets(config: WalletConfig) {}

  private static generate(options: WalletCreateOptions, walletIdentifier: string) {
    const cro = sdk.CroSDK({ network: options.config.network });
    const phrase = HDKey.generateMnemonic(24);

    const privateKey = HDKey.fromMnemonic(phrase).derivePrivKey(options.config.derivationPath);
    const keyPair = Secp256k1KeyPair.fromPrivKey(privateKey);
    const croAddress = new cro.Address(keyPair).account();

    // EVM cronosAddress
    const cronosAddress = ethers.Wallet.fromMnemonic(phrase).address;

    // TODO : Generate assets here
    const assets: UserAsset[] = [
      {
        ...CRO_ASSET(options.config.network),
        walletId: walletIdentifier,
        address: croAddress,
      },
      {
        ...CRONOS_ASSET(options.config.network),
        walletId: walletIdentifier,
        address: cronosAddress,
      },
    ];

    return { encryptedPhrase: phrase, initialAssets: assets };
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
