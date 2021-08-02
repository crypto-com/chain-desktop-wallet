import { WalletConfig } from '../config/StaticConfig';
import { AddressGenerator } from './AddressGenerator';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { CRO_ASSET, CRONOS_ASSET } from '../config/StaticAssets';
import { HDKey } from '../utils/ChainJsLib';

export class WalletOps {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  public generateAssets(config: WalletConfig, walletIdentifier: string, phrase: string) {
    const addressGenerator = new AddressGenerator(phrase, config);
    const assets: UserAsset[] = [
      {
        ...CRO_ASSET(config.network),
        walletId: walletIdentifier,
        address: addressGenerator.getAddress(UserAssetType.TENDERMINT),
      },
      {
        ...CRONOS_ASSET(config.network),
        walletId: walletIdentifier,
        address: addressGenerator.getAddress(UserAssetType.EVM),
      },
    ];

    return assets;
  }

  public generate(config: WalletConfig, walletIdentifier: string) {
    const phrase = HDKey.generateMnemonic(24);
    const assets = this.generateAssets(config, walletIdentifier, phrase);
    return { encryptedPhrase: phrase, initialAssets: assets };
  }
}
