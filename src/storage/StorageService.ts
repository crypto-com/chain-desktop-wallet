import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  SettingsDataUpdate,
  Wallet,
} from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';
import {
  AssetCreationType,
  AssetMarketPrice,
  getAssetPriceId,
  getAssetPriceIdFrom,
  UserAsset,
} from '../models/UserAsset';
import {
  NftAccountTransactionList,
  NftList,
  NftQueryParams,
  NftTransactionHistory,
  ProposalList,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  UnbondingDelegationList,
  TransferTransactionList,
  ValidatorList,
} from '../models/Transaction';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../config/StaticConfig';
import {
  BridgeConfig,
  BridgeNetworkConfigType,
  BridgeTransferDirection,
} from '../service/bridge/BridgeConfig';
import { BridgeTransactionHistoryList } from '../service/bridge/contracts/BridgeModels';

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

  public async updateGeneralSettingsPropagation(
    networkName: string,
    enabledGeneralSettings: boolean,
  ) {
    await this.db.walletStore.update<Wallet>(
      { 'config.name': networkName },
      {
        $set: {
          'config.enableGeneralSettings': enabledGeneralSettings,
        },
      },
      { multi: true },
    );
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

  public async updateDisabledGA(disableGASettings: DisableGASettings) {
    const previousWallet = await this.findWalletByIdentifier(disableGASettings.walletId);
    previousWallet.config.analyticsDisabled = disableGASettings.analyticsDisabled;

    return this.db.walletStore.update<Wallet>(
      { identifier: previousWallet.identifier },
      { $set: previousWallet },
      { upsert: true },
    );
  }

  private async handleGeneralWalletSettingsUpdate(
    dataUpdate: SettingsDataUpdate,
    previousWallet: Wallet,
  ) {
    const updateConfigSettings = {};

    if (dataUpdate.chainId) {
      updateConfigSettings['config.network.chainId'] = dataUpdate.chainId;
    }

    if (dataUpdate.nodeUrl) {
      updateConfigSettings['config.network.defaultNodeUrl'] = dataUpdate.nodeUrl;
      updateConfigSettings['config.nodeUrl'] = dataUpdate.nodeUrl;
    }

    if (dataUpdate.indexingUrl) {
      updateConfigSettings['config.indexingUrl'] = dataUpdate.indexingUrl;
    }

    if (!previousWallet.config.fee) {
      updateConfigSettings['config.fee.gasLimit'] = FIXED_DEFAULT_GAS_LIMIT;
      updateConfigSettings['config.fee.networkFee'] = FIXED_DEFAULT_FEE;
    }

    if (dataUpdate.networkFee) {
      updateConfigSettings['config.fee.networkFee'] = dataUpdate.networkFee;
    }

    if (dataUpdate.gasLimit) {
      updateConfigSettings['config.fee.gasLimit'] = dataUpdate.gasLimit;
    }

    return await this.db.walletStore.update<Wallet>(
      { 'config.name': previousWallet.config.name },
      {
        $set: {
          ...updateConfigSettings,
        },
      },
      { multi: true },
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

    // Handle when general settings has been enabled
    if (previousWallet.config.enableGeneralSettings) {
      return this.handleGeneralWalletSettingsUpdate(dataUpdate, previousWallet);
    }

    if (dataUpdate.chainId) {
      previousWallet.config.network.chainId = dataUpdate.chainId;
    }

    if (dataUpdate.nodeUrl) {
      previousWallet.config.nodeUrl = dataUpdate.nodeUrl;
      previousWallet.config.network.defaultNodeUrl = dataUpdate.nodeUrl;
    }

    if (dataUpdate.explorer) {
      previousWallet.config.explorer = dataUpdate.explorer;
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

  public async saveBridgeConfig(bridgeConfig: BridgeConfig) {
    const configID = `${bridgeConfig.bridgeNetworkConfigType}_${bridgeConfig.bridgeDirectionType}`;
    return this.db.bridgeConfigStore.update<BridgeConfig>(
      { _id: configID },
      { $set: bridgeConfig },
      { upsert: true },
    );
  }

  public async saveBridgeConfigsList(bridgeConfigList: BridgeConfig[]) {
    return bridgeConfigList.map(async bridgeConfig => {
      await this.saveBridgeConfig(bridgeConfig);
    });
  }

  public async findBridgeConfigByNetworkAndBridgeTransactionType(
    bridgeDirectionType: BridgeTransferDirection,
    bridgeNetworkConfigType: BridgeNetworkConfigType,
  ) {
    return this.db.bridgeConfigStore.findOne<BridgeConfig>({
      bridgeNetworkConfigType,
      bridgeDirectionType,
    });
  }

  public async fetchAllBridgeConfigs() {
    return this.db.bridgeConfigStore.find<BridgeConfig>({});
  }

  public async fetchAssetByCreationType(creationType: AssetCreationType, walletId) {
    return this.db.assetStore.find<UserAsset>({
      assetCreationType: creationType,
      walletId,
    });
  }

  public async removeWalletAssets(walletId: string) {
    return this.db.assetStore.remove({ walletId }, { multi: true });
  }

  public async findWalletByIdentifier(identifier: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier });
  }

  public async retrieveAllWallets() {
    return this.db.walletStore.find<Wallet>({});
  }

  public async retrieveAssetsByWallet(walletId: string) {
    // const wallet = await this.db.walletStore.findOne<Wallet>({ identifier: walletId });
    // const userAssets = wallet.assets;
    return await this.db.assetStore.find<UserAsset>({ walletId });
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

  public async retrieveAllAssetsPrices(currency: string) {
    return this.db.marketPriceStore.find<AssetMarketPrice>({ _id: new RegExp(currency) });
  }

  public async retrieveAssetPrice(assetSymbol: string, currency: string) {
    const assetPriceId = getAssetPriceIdFrom(assetSymbol, currency);
    return this.db.marketPriceStore.findOne<AssetMarketPrice>({ _id: assetPriceId });
  }

  public retrieveCurrentSession() {
    return this.db.sessionStore.findOne<Session>({ _id: Session.SESSION_ID });
  }

  // public async saveTransferTransaction(
  //   transferTransaction: TransferTransactionData,
  //   walletId: string,
  // ) {
  //   const currentTransfers = await this.retrieveAllTransferTransactions(walletId);
  //   let transactions: Array<TransferTransactionData> = [];
  //   if (currentTransfers) {
  //     currentTransfers.transactions.push(transferTransaction);
  //     transactions = currentTransfers.transactions;
  //   } else {
  //     transactions.push(transferTransaction);
  //   }
  //
  //   return this.saveTransferTransactions({
  //     transactions,
  //     walletId,
  //   });
  // }

  public async saveStakingTransaction(stakingTransaction: StakingTransactionData) {
    return this.db.stakingStore.update<StakingTransactionData>(
      { hash: stakingTransaction.hash },
      { $set: stakingTransaction },
      { upsert: true },
    );
  }

  public async saveStakingTransactions(stakingTransactions: StakingTransactionList) {
    if (stakingTransactions.transactions.length === 0) {
      return Promise.resolve();
    }
    await this.db.stakingStore.remove({ walletId: stakingTransactions.walletId }, { multi: true });
    return this.db.stakingStore.insert(stakingTransactions);
  }

  public async saveRewardList(rewardTransactions: RewardTransactionList) {
    if (rewardTransactions.transactions.length === 0) {
      return Promise.resolve();
    }
    await this.db.rewardStore.remove({ walletId: rewardTransactions.walletId }, { multi: true });
    return this.db.rewardStore.insert(rewardTransactions);
  }

  public async saveUnbondingDelegations(unbondingDelegations: UnbondingDelegationList) {
    if (unbondingDelegations.delegations.length === 0) {
      return Promise.resolve();
    }
    await this.db.unbondingDelegationStore.remove(
      { walletId: unbondingDelegations.walletId },
      { multi: true },
    );
    return this.db.unbondingDelegationStore.insert(unbondingDelegations);
  }

  public async retrieveAllStakingTransactions(walletId: string) {
    return this.db.stakingStore.findOne<StakingTransactionList>({ walletId });
  }

  public async retrieveAllRewards(walletId: string) {
    return this.db.rewardStore.findOne<RewardTransactionList>({ walletId });
  }

  public async retrieveAllUnbondingDelegations(walletId: string) {
    return this.db.unbondingDelegationStore.findOne<UnbondingDelegationList>({ walletId });
  }

  public async saveTransferTransactions(transferTransactionList: TransferTransactionList) {
    if (transferTransactionList.transactions.length === 0) {
      return Promise.resolve();
    }
    await this.db.transferStore.remove(
      { walletId: transferTransactionList.walletId, assetId: transferTransactionList.assetId },
      { multi: true },
    );
    return this.db.transferStore.insert<TransferTransactionList>(transferTransactionList);
  }

  public async retrieveAllTransferTransactions(walletId: string, assetID?: string) {
    return this.db.transferStore.findOne<TransferTransactionList>({
      walletId,
      assetId: assetID,
    });
  }

  public async saveNFTAccountTransactions(nftAccountTransactionList: NftAccountTransactionList) {
    if (nftAccountTransactionList.transactions.length === 0) {
      return Promise.resolve();
    }
    await this.db.nftAccountTxStore.remove(
      { walletId: nftAccountTransactionList.walletId },
      { multi: true },
    );
    return this.db.nftAccountTxStore.insert<NftAccountTransactionList>(nftAccountTransactionList);
  }

  public async retrieveAllNFTAccountTransactions(
    walletId: string,
  ): Promise<NftAccountTransactionList> {
    return this.db.nftAccountTxStore.findOne<NftAccountTransactionList>({ walletId });
  }

  public async saveValidators(validatorList: ValidatorList) {
    if (validatorList.validators.length === 0) {
      return Promise.resolve();
    }
    await this.db.validatorStore.remove({ chainId: validatorList.chainId }, { multi: true });
    return this.db.validatorStore.insert<ValidatorList>(validatorList);
  }

  public async retrieveAllValidators(chainId: string) {
    return this.db.validatorStore.findOne<ValidatorList>({ chainId });
  }

  public async saveProposals(proposalList: ProposalList) {
    if (proposalList.proposals.length === 0) {
      return Promise.resolve();
    }
    await this.db.proposalStore.remove({ chainId: proposalList.chainId }, { multi: true });
    return this.db.proposalStore.insert<ProposalList>(proposalList);
  }

  public async retrieveAllProposals(chainId: string) {
    return this.db.proposalStore.findOne<ProposalList>({ chainId });
  }

  public async saveNFTs(nftList: NftList) {
    if (!nftList) {
      return Promise.resolve();
    }
    await this.db.nftStore.remove({ walletId: nftList.walletId }, { multi: true });
    return this.db.nftStore.insert<NftList>(nftList);
  }

  public async retrieveAllNfts(walletId: string) {
    return this.db.nftStore.findOne<NftList>({ walletId });
  }

  public async saveNFTTransferHistory(nftTransactionHistory: NftTransactionHistory) {
    if (!nftTransactionHistory || nftTransactionHistory.transfers.length === 0) {
      return Promise.resolve();
    }
    await this.db.nftTransferHistoryStore.remove(
      {
        walletId: nftTransactionHistory.walletId,
        nftQuery: nftTransactionHistory.nftQuery,
      },
      { multi: true },
    );

    return this.db.nftTransferHistoryStore.insert<NftTransactionHistory>(nftTransactionHistory);
  }

  public async retrieveNFTTransferHistory(walletId: string, nftQuery: NftQueryParams) {
    return this.db.nftTransferHistoryStore.findOne<NftTransactionHistory>({ walletId, nftQuery });
  }

  public async saveBridgeTransactions(bridgeTransactions: BridgeTransactionHistoryList) {
    if (!bridgeTransactions) {
      return Promise.resolve();
    }
    await this.db.bridgeTransactionStore.remove(
      { walletId: bridgeTransactions.walletId },
      { multi: true },
    );
    return this.db.bridgeTransactionStore.insert<BridgeTransactionHistoryList>(bridgeTransactions);
  }

  public async retrieveAllBridgeTransactions(walletId: string) {
    return this.db.bridgeTransactionStore.findOne<BridgeTransactionHistoryList>({ walletId });
  }
}
