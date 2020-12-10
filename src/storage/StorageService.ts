// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';
import {
  AssetMarketPrice,
  getAssetPriceId,
  getAssetPriceIdFrom,
  UserAsset,
} from '../models/UserAsset';

export class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async saveWallet(wallet: Wallet) {
    return this.db.walletStore.update(
      { identifier: wallet.identifier },
      { $set: wallet },
      { upsert: true },
    );
  }

  public async saveAsset(asset: UserAsset) {
    return this.db.assetStore.update({ _id: asset.identifier }, { $set: asset }, { upsert: true });
  }

  public async findWalletByIdentifier(identifier: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier });
  }

  public async fetchWallets() {
    return this.db.walletStore.find<Wallet>({});
  }

  public async fetchAssetsByWallet(walletId: string) {
    return this.db.assetStore.find<UserAsset>({ walletId });
  }

  public async setSession(session: Session) {
    return this.db.sessionStore.update(
      { _id: Session.SESSION_ID },
      { $set: session },
      { upsert: true },
    );
  }

  public async saveAssetMarketPrice(assetPrice: AssetMarketPrice) {
    const assetPriceId = getAssetPriceId(assetPrice);
    return this.db.marketPriceStore.update(
      { _id: assetPriceId },
      { $set: assetPrice },
      { upsert: true },
    );
  }

  public async retrieveAssetPrice(assetSymbol: string, currency: string) {
    const assetPriceId = getAssetPriceIdFrom(assetSymbol, currency);
    return this.db.marketPriceStore.findOne<AssetMarketPrice>({ _id: assetPriceId });
  }

  public retrieveCurrentSession() {
    return this.db.sessionStore.findOne<Session>({ _id: Session.SESSION_ID });
  }
}
