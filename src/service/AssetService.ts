import { StorageService } from '../storage/StorageService';
import { NodeRpcService } from './rpc/NodeRpcService';
import { UserAsset } from '../models/UserAsset';
import { croMarketPriceApi } from './rpc/MarketApi';

class AssetService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService('app-db');
  }

  public async fetchAndUpdateBalances() {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    const assets: UserAsset[] = await this.fetchCurrentWalletAssets();

    await Promise.all(
      assets.map(async asset => {
        asset.balance = await nodeRpc.loadAccountBalance(
          currentSession.wallet.address,
          asset.symbol,
        );
        await this.storageService.saveAsset(asset);
      }),
    );
  }

  public async fetchCurrentWalletAssets(): Promise<UserAsset[]> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const assets = await this.storageService.fetchAssetsByWallet(currentSession.wallet.identifier);

    return assets.map(data => {
      const asset: UserAsset = { ...data };
      return asset;
    });
  }

  public async fetchDefaultWalletAsset(): Promise<UserAsset> {
    return (await this.fetchCurrentWalletAssets())[0];
  }

  public async loadAndSaveAssetPrices() {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const assets: UserAsset[] = await this.fetchCurrentWalletAssets();

    await Promise.all(
      assets.map(async asset => {
        const assetPrice = await croMarketPriceApi.getAssetPrice(
          asset.symbol,
          currentSession.currency,
        );
        await this.storageService.saveAssetMarketPrice(assetPrice);
      }),
    );
  }
}

export const assetService = new AssetService();
