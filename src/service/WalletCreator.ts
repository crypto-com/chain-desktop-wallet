import { Wallet } from '../models/Wallet';
import { WalletConfig } from '../config/StaticConfig';
import { getRandomId } from '../crypto/RandomGen';
import { WalletBuiltResult, WalletOps } from './WalletOps';
import { UserAssetType } from '../models/UserAsset';

export class WalletCreator extends WalletOps {
  private readonly createOptions: WalletCreateOptions;

  constructor(options: WalletCreateOptions) {
    super();
    this.createOptions = options;
  }

  public create(): WalletBuiltResult {
    const options = this.createOptions;
    const walletIdentifier = getRandomId();
    const { initialAssets, encryptedPhrase } = this.generate(options.config, walletIdentifier);

    const defaultAsset = initialAssets.filter(
      asset => asset.assetType === UserAssetType.TENDERMINT,
    )[0];

    const newWallet: Wallet = {
      identifier: walletIdentifier,
      name: options.walletName,
      address: defaultAsset?.address || '',
      config: options.config,
      encryptedPhrase,
      hasBeenEncrypted: false,
      walletType: options.walletType,
      addressIndex: options.addressIndex,
      // assets: initialAssets,
    };

    return {
      wallet: newWallet,
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
