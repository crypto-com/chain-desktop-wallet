import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { getRandomId } from '../crypto/RandomGen';
import { WalletBuiltResult, WalletOps } from './WalletOps';
import { UserAssetType } from '../models/UserAsset';

export class WalletImporter extends WalletOps {
  private readonly importOptions: WalletImportOptions;

  constructor(importOptions: WalletImportOptions) {
    super();
    this.importOptions = importOptions;
  }

  public import(): WalletBuiltResult {
    const options = this.importOptions;
    const walletIdentifier = getRandomId();
    const { initialAssets, encryptedPhrase } = this.generate(
      options.config,
      walletIdentifier,
      options.phrase,
    );

    const defaultAsset = initialAssets.filter(
      asset => asset.assetType === UserAssetType.TENDERMINT,
    )[0];

    const importedWallet: Wallet = {
      identifier: walletIdentifier,
      name: options.walletName,
      address: defaultAsset?.address || '',
      config: options.config,
      encryptedPhrase,
      hasBeenEncrypted: false,
      walletType: options.walletType,
      addressIndex: options.addressIndex,
    };
    return {
      wallet: importedWallet,
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
