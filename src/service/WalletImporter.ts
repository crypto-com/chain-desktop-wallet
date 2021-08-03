import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { getRandomId } from '../crypto/RandomGen';
import { WalletOps } from './WalletOps';

export class WalletImporter extends WalletOps {
  private readonly importOptions: WalletImportOptions;

  constructor(importOptions: WalletImportOptions) {
    super();
    this.importOptions = importOptions;
  }

  public import(): Wallet {
    const options = this.importOptions;
    const walletIdentifier = getRandomId();
    const { initialAssets, encryptedPhrase } = this.generate(options.config, walletIdentifier);

    return {
      identifier: getRandomId(),
      name: options.walletName,
      // Legacy field
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

export class WalletImportOptions {
  public readonly config: WalletConfig;

  public readonly walletName: string;

  public readonly phrase: string;

  public readonly walletType: string;

  public readonly addressIndex: number;

  constructor(
    walletName: string,
    walletConfig: WalletConfig,
    phrase: string,
    walletType: string,
    addressIndex: number,
  ) {
    this.walletName = walletName;
    this.config = walletConfig;
    this.phrase = phrase;
    this.walletType = walletType;
    this.addressIndex = addressIndex;
  }
}
