import { DisableDefaultMemoSettings, SettingsDataUpdate, Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';
import {
  AssetMarketPrice,
  getAssetPriceId,
  getAssetPriceIdFrom,
  UserAsset,
} from '../models/UserAsset';
import {
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  TransferTransactionData,
  TransferTransactionList,
  ValidatorList,
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

  public async deleteWallet(walletID: string) {
    return this.db.walletStore.remove({ identifier: walletID }, { multi: true });
  }

  public async updateDisabledDefaultMemo(disableDefaultMemoSettings: DisableDefaultMemoSettings) {
    const previousWallet = await this.findWalletByIdentifier(disableDefaultMemoSettings.walletId);
    previousWallet.config.disableDefaultClientMemo =
      disableDefaultMemoSettings.disableDefaultMemoAppend;

    return this.db.walletStore.update<Wallet>(
      { identifier: previousWallet.identifier },
      { $set: previousWallet },
      { upsert: true },
    );
  }

  public async updateWalletSettings(dataUpdate: SettingsDataUpdate) {
    if (
      !dataUpdate.chainId &&
      !dataUpdate.nodeUrl &&
      !dataUpdate.indexingUrl &&
      !dataUpdate.networkFee &&
      !dataUpdate.gasLimit
    ) {
      return Promise.resolve();
    }
    const previousWallet = await this.findWalletByIdentifier(dataUpdate.walletId);
    if (dataUpdate.chainId) {
      previousWallet.config.network.chainId = dataUpdate.chainId;
    }

    if (dataUpdate.nodeUrl) {
      previousWallet.config.nodeUrl = dataUpdate.nodeUrl;
      previousWallet.config.network.defaultNodeUrl = dataUpdate.nodeUrl;
    }

    if (dataUpdate.indexingUrl) {
      previousWallet.config.indexingUrl = dataUpdate.indexingUrl;
    }

    if (previousWallet.config.fee === undefined)
      previousWallet.config.fee = {
        gasLimit: '0',
        networkFee: '0',
      };

    if (dataUpdate.networkFee) {
      previousWallet.config.fee.networkFee = dataUpdate.networkFee;
    }

    if (dataUpdate.gasLimit) {
      previousWallet.config.fee.gasLimit = dataUpdate.gasLimit;
    }

    return this.db.walletStore.update<Wallet>(
      { identifier: previousWallet.identifier },
      { $set: previousWallet },
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

  public async saveTransferTransaction(
    transferTransaction: TransferTransactionData,
    walletId: string,
  ) {
    const currentTransfers = await this.retrieveAllTransferTransactions(walletId);
    let transactions: Array<TransferTransactionData> = [];
    if (currentTransfers) {
      currentTransfers.transactions.push(transferTransaction);
      transactions = currentTransfers.transactions;
    } else {
      transactions.push(transferTransaction);
    }

    return this.saveTransferTransactions({
      transactions,
      walletId,
    });
  }

  public async saveStakingTransaction(stakingTransaction: StakingTransactionData) {
    return this.db.stakingStore.update<StakingTransactionData>(
      { hash: stakingTransaction.hash },
      { $set: stakingTransaction },
      { upsert: true },
    );
  }

  public async saveStakingTransactions(stakingTransactions: StakingTransactionList) {
    await this.db.stakingStore.remove({ walletId: stakingTransactions.walletId }, { multi: true });
    return this.db.stakingStore.insert(stakingTransactions);
  }

  public async saveRewardList(rewardTransactions: RewardTransactionList) {
    await this.db.rewardStore.remove({ walletId: rewardTransactions.walletId }, { multi: true });
    return this.db.rewardStore.insert(rewardTransactions);
  }

  public async retrieveAllStakingTransactions(walletId: string) {
    return this.db.stakingStore.findOne<StakingTransactionList>({ walletId });
  }

  public async retrieveAllRewards(walletId: string) {
    return this.db.rewardStore.findOne<RewardTransactionList>({ walletId });
  }

  public async saveTransferTransactions(transferTransactionList: TransferTransactionList) {
    await this.db.transferStore.remove(
      { walletId: transferTransactionList.walletId },
      { multi: true },
    );
    return this.db.transferStore.insert<TransferTransactionList>(transferTransactionList);
  }

  public async retrieveAllTransferTransactions(walletId: string) {
    return this.db.transferStore.findOne<TransferTransactionList>({ walletId });
  }

  public async saveValidators(validatorList: ValidatorList) {
    await this.db.validatorStore.remove({ chainId: validatorList.chainId }, { multi: true });
    return this.db.validatorStore.insert<ValidatorList>(validatorList);
  }

  public async retrieveAllValidators(chainId: string) {
    return this.db.validatorStore.findOne<ValidatorList>({ chainId });
  }
}
