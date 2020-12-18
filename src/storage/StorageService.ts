import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';
import {
  AssetMarketPrice,
  getAssetPriceId,
  getAssetPriceIdFrom,
  UserAsset,
} from '../models/UserAsset';
import {
  RewardTransaction,
  StakingTransactionData,
  TransferTransactionData,
} from '../models/Transaction';

export class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async saveWallet(wallet: Wallet) {
    return this.db.walletStore.update<Wallet>(
      { identifier: wallet.identifier },
      { $set: wallet },
      { upsert: true },
    );
  }

  public async saveAsset(asset: UserAsset) {
    return this.db.assetStore.update<UserAsset>(
      { _id: asset.identifier },
      { $set: asset },
      { upsert: true },
    );
  }

  public async findWalletByIdentifier(identifier: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier });
  }

  public async retrieveAllWallets() {
    return this.db.walletStore.find<Wallet>({});
  }

  public async retrieveAssetsByWallet(walletId: string) {
    return this.db.assetStore.find<UserAsset>({ walletId });
  }

  public async setSession(session: Session) {
    return this.db.sessionStore.update<Session>(
      { _id: Session.SESSION_ID },
      { $set: session },
      { upsert: true },
    );
  }

  public async saveAssetMarketPrice(assetPrice: AssetMarketPrice) {
    const assetPriceId = getAssetPriceId(assetPrice);
    return this.db.marketPriceStore.update<AssetMarketPrice>(
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

  public async saveTransferTransaction(transferTransaction: TransferTransactionData) {
    return this.db.transferStore.update<TransferTransactionData>(
      { hash: transferTransaction.hash },
      { $set: transferTransaction },
      { upsert: true },
    );
  }

  public async retrieveAllTransferTransactions() {
    return this.db.transferStore.find<TransferTransactionData>({});
  }

  public async saveStakingTransaction(stakingTransaction: StakingTransactionData) {
    return this.db.stakingStore.update<StakingTransactionData>(
      { hash: stakingTransaction.hash },
      { $set: stakingTransaction },
      { upsert: true },
    );
  }

  public async saveStakingTransactions(stakingTransactions: Array<StakingTransactionData>) {
    await this.db.stakingStore.remove({}, { multi: true });
    return this.db.stakingStore.insert(stakingTransactions);
  }

  public async saveRewardList(rewardTransactions: Array<RewardTransaction>) {
    await this.db.rewardStore.remove({}, { multi: true });
    return this.db.rewardStore.insert(rewardTransactions);
  }

  public async retrieveAllStakingTransactions() {
    return this.db.stakingStore.find<StakingTransactionData>({});
  }

  public async retrieveAllRewards() {
    return this.db.rewardStore.find<RewardTransaction>({});
  }
}
