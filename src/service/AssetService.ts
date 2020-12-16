import { StorageService } from '../storage/StorageService';
import { NodeRpcService } from './rpc/NodeRpcService';
import { AssetMarketPrice, UserAsset } from '../models/UserAsset';
import { croMarketPriceApi } from './rpc/MarketApi';
import { APP_DB_NAMESPACE } from '../config/StaticConfig';

class AssetService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
  }

  public async fetchAndUpdateBalances() {
    const currentSession = await this.storageService.retrieveCurrentSession();
    if (!currentSession) {
      return;
    }
    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets();

    if (!assets || assets.length === 0) {
      return;
    }

    await Promise.all(
      assets.map(async asset => {
        const baseDenomination = currentSession.wallet.config.network.coin.baseDenom;
        asset.balance = await nodeRpc.loadAccountBalance(
          currentSession.wallet.address,
          baseDenomination,
        );
        await this.storageService.saveAsset(asset);
      }),
    );
  }

  public async retrieveCurrentWalletAssets(): Promise<UserAsset[]> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const assets = await this.storageService.retrieveAssetsByWallet(
      currentSession.wallet.identifier,
    );

    return assets.map(data => {
      const asset: UserAsset = { ...data };
      return asset;
    });
  }

  public async retrieveDefaultWalletAsset(): Promise<UserAsset> {
    return (await this.retrieveCurrentWalletAssets())[0];
  }

  public async loadAndSaveAssetPrices() {
    const currentSession = await this.storageService.retrieveCurrentSession();
    if (!currentSession) {
      return;
    }

    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets();

    if (!assets || assets.length === 0) {
      return;
    }

    await Promise.all(
      assets.map(async (asset: UserAsset) => {
        const assetPrice = await croMarketPriceApi.getAssetPrice(
          asset.mainnetSymbol,
          currentSession.currency,
        );
        await this.storageService.saveAssetMarketPrice(assetPrice);
      }),
    );
  }

  public async retrieveAssetPrice(
    assetSymbol: string,
    currency: string = 'USD',
  ): Promise<AssetMarketPrice> {
    const price = await this.storageService.retrieveAssetPrice(assetSymbol, currency);
    return {
      ...price,
    };
  }

  public async syncData(): Promise<void> {
    try {
      await this.fetchAndUpdateBalances();
      return this.loadAndSaveAssetPrices();
      // eslint-disable-next-line no-empty
    } catch (e) {
      return Promise.resolve();
    }
  }
}

export const assetService = new AssetService();
