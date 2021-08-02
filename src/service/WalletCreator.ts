import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { getRandomId } from '../crypto/RandomGen';
import { WalletOps } from './WalletOps';

export class WalletCreator extends WalletOps {
  private readonly createOptions: WalletCreateOptions;

  constructor(options: WalletCreateOptions) {
    super();
    this.createOptions = options;
  }

  public create(): Wallet {
    const options = this.createOptions;
    const walletIdentifier = getRandomId();
    const { initialAssets, encryptedPhrase } = this.generate(options.config, walletIdentifier);

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
