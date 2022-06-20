import { WalletConfig } from '../config/StaticConfig';
import { AddressGenerator } from './AddressGenerator';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { CRONOS_TENDERMINT_ASSET, CRONOS_EVM_ASSET, ETH_ASSET } from '../config/StaticAssets';
import { HDKey } from '../utils/ChainJsLib';
import { Wallet } from '../models/Wallet';

export class WalletOps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  public generateAssets(config: WalletConfig, walletIdentifier: string, phrase: string) {
    const addressGenerator = new AddressGenerator(phrase, config);
    const assets: UserAsset[] = [
      {
        ...CRONOS_TENDERMINT_ASSET(config),
        walletId: walletIdentifier,
        address: addressGenerator.getAddress(UserAssetType.TENDERMINT),
      },
      {
        ...CRONOS_EVM_ASSET(config),
        walletId: walletIdentifier,
        address: addressGenerator.getAddress(UserAssetType.EVM),
      },
      {
        ...ETH_ASSET(config),
        walletId: walletIdentifier,
        address: addressGenerator.getAddress(UserAssetType.EVM),
      },
    ];

    return assets;
  }

  public generate(config: WalletConfig, walletIdentifier: string, availablePhrase?: string) {
    const phrase = availablePhrase || HDKey.generateMnemonic(24);
    const assets = this.generateAssets(config, walletIdentifier, phrase);
    return { encryptedPhrase: phrase, initialAssets: assets };
  }
}

export interface WalletBuiltResult {
  wallet: Wallet;
  assets: UserAsset[];
}
