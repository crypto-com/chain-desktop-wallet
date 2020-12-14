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

    const assets: UserAsset[] = await this.fetchCurrentWalletAssets();

    if (!assets || assets.length === 0) {
      return;
    }

    await Promise.all(
      assets.map(async asset => {
        asset.balance = await nodeRpc.loadAccountBalance(
          currentSession.wallet.address,
          asset.symbol,
        );
        // eslint-disable-next-line no-console
        console.log('LOADED_ASSET_BALANCE: ', asset.balance);
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
    if (!currentSession) {
      return;
    }

    const assets: UserAsset[] = await this.fetchCurrentWalletAssets();

    if (!assets || assets.length === 0) {
      return;
    }

    await Promise.all(
      assets.map(async asset => {
        const assetPrice = await croMarketPriceApi.getAssetPrice(
          asset.symbol,
          currentSession.currency,
        );
        // eslint-disable-next-line no-console
        console.log('LOADED_ASSET_PRICE: ', assetPrice);
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
}

export const assetService = new AssetService();
