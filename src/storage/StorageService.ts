import _ from 'lodash';
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
  CommonTransactionRecord,
  NftAccountTransactionRecord,
  NftTransferRecord,
  RewardTransactionRecord,
  TransferTransactionRecord,
  IBCTransactionRecord,
  StakingTransactionRecord,
  CommonAttributesRecord,
  NftAttributesRecord,
  StakingAttributesRecord,
  RewardAttributesRecord,
} from '../models/Transaction';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../config/StaticConfig';
import {
  BridgeConfig,
  BridgeNetworkConfigType,
  BridgeTransferDirection,
} from '../service/bridge/BridgeConfig';
import { BridgeTransactionHistoryList } from '../service/bridge/contracts/BridgeModels';
import { AddressBookContactModel } from '../models/AddressBook';
// import { generalConfigService } from './GeneralConfigService';

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

  public async removeAssets(assets: UserAsset[]) {
    return this.db.assetStore.remove(
      { _id: { $in: assets.map(asset => asset.identifier) } },
      { multi: true },
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
    return this.db.marketPriceStore.find<AssetMarketPrice>({ currency });
  }

  public async retrieveAssetPrice(assetSymbol: string, currency: string) {
    const assetPriceId = getAssetPriceIdFrom(assetSymbol, currency);
    return this.db.marketPriceStore.findOne<AssetMarketPrice>({ _id: assetPriceId });
  }

  public retrieveCurrentSession() {
    return this.db.sessionStore.findOne<Session>({ _id: Session.SESSION_ID });
  }

  /**
   * @deprecated Not in use anywhere, safe marking
   * @param stakingTransaction {StakingTransactionData}
   */
  // eslint-disable-next-line
  public async saveStakingTransaction(stakingTransaction: StakingTransactionData) {
    // return this.db.stakingStore.update<StakingTransactionData>(
    //   { hash: stakingTransaction.hash },
    //   { $set: stakingTransaction },
    //   { upsert: true },
    // );
  }

  // eslint-disable-next-line consistent-return
  public async saveStakingTransactions(stakingTransactions: StakingTransactionList) {
    if (stakingTransactions.transactions.length === 0) {
      return Promise.resolve();
    }
    const stakingTxRecords: StakingTransactionRecord[] = stakingTransactions.transactions.map(
      tx => {
        return {
          txType: 'staking',
          walletId: stakingTransactions.walletId,
          txData: tx,
          txHash: tx.hash,
        };
      },
    );

    const stakingAttributeRecord: StakingAttributesRecord = {
      type: 'staking',
      walletId: stakingTransactions.walletId,
      customParams: {
        totalBalance: stakingTransactions.totalBalance,
      },
    };

    // Manually remove `staking` records first
    await this.db.commonTransactionStore.remove(
      {
        walletId: stakingTransactions.walletId,
        txType: 'staking',
      },
      {
        multi: true,
      },
    );

    await this.insertCommonTransactionRecords(stakingTxRecords);

    // Insert to common Attributes store
    await this.updateCommonAttributes(stakingAttributeRecord);

    // @deprecated
    /**
     * await this.db.stakingStore.remove({ walletId: stakingTransactions.walletId }, { multi: true });
    return this.db.stakingStore.insert(stakingTransactions); */
  }

  // eslint-disable-next-line consistent-return
  public async saveRewardList(rewardTransactions: RewardTransactionList) {
    if (rewardTransactions.transactions.length === 0) {
      return Promise.resolve();
    }
    const rewardTxRecords: RewardTransactionRecord[] = rewardTransactions.transactions.map(tx => {
      return {
        walletId: rewardTransactions.walletId,
        txType: 'reward',
        txData: tx,
      };
    });

    const rewardAttributeRecord: RewardAttributesRecord = {
      walletId: rewardTransactions.walletId,
      type: 'reward',
      customParams: {
        totalBalance: rewardTransactions.totalBalance,
        claimedRewardsBalance: rewardTransactions.claimedRewardsBalance,
        estimatedApy: rewardTransactions.estimatedApy,
        estimatedRewardsBalance: rewardTransactions.estimatedRewardsBalance,
      },
    };

    // Remove previous `reward` records before insertion
    await this.db.commonTransactionStore.remove(
      {
        walletId: rewardTransactions.walletId,
        txType: 'reward',
      },
      {
        multi: true,
      },
    );

    // Insert to common transactoin store
    await this.insertCommonTransactionRecords(rewardTxRecords);

    // Insert to common Attributes store
    await this.updateCommonAttributes(rewardAttributeRecord);

    // @deprecated
    /**
     *
    await this.db.rewardStore.remove({ walletId: rewardTransactions.walletId }, { multi: true });
    return this.db.rewardStore.insert(rewardTransactions); */
  }

  public async saveUnbondingDelegations(unbondingDelegations: UnbondingDelegationList) {
    // Remove previous `unbonding` records before insertion
    await this.db.unbondingDelegationStore.remove(
      { walletId: unbondingDelegations.walletId },
      { multi: true },
    );
    if (unbondingDelegations.delegations.length === 0) {
      return Promise.resolve();
    }
    return this.db.unbondingDelegationStore.insert(unbondingDelegations);
  }

  public async retrieveAllStakingTransactions(walletId: string) {
    const stakingTxRecord = await this.db.commonTransactionStore.find<StakingTransactionRecord>({
      walletId,
      txType: 'staking',
    });

    const stakingCustomParams = await this.db.commonAttributeStore.findOne<StakingAttributesRecord>(
      {
        walletId,
        type: 'staking',
      },
    );

    return {
      transactions: stakingTxRecord.map(tx => tx.txData),
      walletId,
      totalBalance: stakingCustomParams?.customParams?.totalBalance || '0',
    } as StakingTransactionList;

    // return this.db.stakingStore.findOne<StakingTransactionList>({ walletId });
  }

  public async retrieveAllRewards(walletId: string) {
    const rewardTxs = await this.db.commonTransactionStore.find<RewardTransactionRecord>({
      walletId,
      txType: 'reward',
    });

    const rewardCustomParams = await this.db.commonAttributeStore.findOne<RewardAttributesRecord>({
      walletId,
      type: 'reward',
    });

    return {
      transactions: rewardTxs.map(tx => tx.txData),
      walletId,
      totalBalance: rewardCustomParams?.customParams?.totalBalance || '0',
      claimedRewardsBalance: rewardCustomParams?.customParams?.claimedRewardsBalance || '0',
      estimatedApy: rewardCustomParams?.customParams?.estimatedApy || '0',
      estimatedRewardsBalance: rewardCustomParams?.customParams?.estimatedRewardsBalance || '0',
    } as RewardTransactionList;

    // return this.db.rewardStore.findOne<RewardTransactionList>({ walletId });
  }

  public async retrieveAllUnbondingDelegations(walletId: string) {
    return this.db.unbondingDelegationStore.findOne<UnbondingDelegationList>({ walletId });
  }

  // eslint-disable-next-line
  public async saveTransferTransactions(transferTransactionList: TransferTransactionList) {
    if (transferTransactionList.transactions.length === 0) {
      return Promise.resolve();
    }
    // Save into new transaction store
    const transferTxRecords: TransferTransactionRecord[] = transferTransactionList.transactions.map(
      tx => {
        return {
          walletId: transferTransactionList.walletId,
          txType: 'transfer',
          txData: tx,
          txHash: tx.hash,
          assetId: transferTransactionList.assetId,
        };
      },
    );
    await this.insertCommonTransactionRecords(transferTxRecords);

    // @deprecated
    /**
     *await this.db.transferStore.remove(
      {
        walletId: transferTransactionList.walletId,
        assetId: transferTransactionList.assetId,
      },
      { multi: true },
    );
    return this.db.transferStore.insert<TransferTransactionList>(transferTransactionList); */
  }

  // eslint-disable-next-line
  public async retrieveAllTransferTransactions(walletId: string, assetID?: string) {
    const transferRecords = await this.db.commonTransactionStore.find<TransferTransactionRecord>({
      walletId,
      txType: 'transfer',
      assetId: assetID,
    });

    // Sort the txdata list by `date` in descending
    const txDataList = _.orderBy(
      transferRecords.map(record => record.txData),
      'date',
      'desc',
    );

    return {
      transactions: txDataList,
      walletId,
      assetId: assetID,
    } as TransferTransactionList;

    // Todo: Deprecated
    // return this.db.transferStore.findOne<TransferTransactionList>({
    //   walletId,
    //   assetId: assetID,
    // });
  }

  // eslint-disable-next-line
  public async saveNFTAccountTransactions(nftAccountTransactionList: NftAccountTransactionList) {
    if (nftAccountTransactionList.transactions.length === 0) {
      return Promise.resolve();
    }
    // Save into new transaction store
    const nftAccountTxRecords: NftAccountTransactionRecord[] = nftAccountTransactionList.transactions.map(
      tx => {
        return {
          walletId: nftAccountTransactionList.walletId,
          txType: 'nftAccount',
          txData: tx,
          txHash: tx.transactionHash,
        };
      },
    );
    await this.insertCommonTransactionRecords(nftAccountTxRecords);

    // @deprecated
    /**
     *await this.db.nftAccountTxStore.remove(
      { walletId: nftAccountTransactionList.walletId },
      { multi: true },
    );
    return this.db.nftAccountTxStore.insert<NftAccountTransactionList>(nftAccountTransactionList); */
  }

  public async retrieveAllNFTAccountTransactions(
    walletId: string,
  ): Promise<NftAccountTransactionList> {
    const nftAccountTxRecords = await this.db.commonTransactionStore.find<
      NftAccountTransactionRecord
    >({
      walletId,
      txType: 'nftAccount',
    });

    // Sort the txdata list by `blockTime` in descending
    const txDataList = _.orderBy(
      nftAccountTxRecords.map(record => record.txData),
      'blockTime',
      'desc',
    );

    return {
      transactions: txDataList,
      walletId,
    } as NftAccountTransactionList;

    // @deprecated
    // return this.db.nftAccountTxStore.findOne<NftAccountTransactionList>({ walletId });
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

  // eslint-disable-next-line
  public async saveNFTTransferHistory(nftTransactionHistory: NftTransactionHistory) {
    if (!nftTransactionHistory || nftTransactionHistory.transfers.length === 0) {
      return Promise.resolve();
    }
    // Save into new transaction store
    const nftTxRecords: NftTransferRecord[] = nftTransactionHistory.transfers.map(tx => {
      return {
        walletId: nftTransactionHistory.walletId,
        txType: 'nftTransfer',
        txData: tx,
        txHash: tx.transactionHash,
        messageTypeName: tx.messageType,
      };
    });
    await this.insertCommonTransactionRecords(nftTxRecords);

    // @deprecated
    /**
     *await this.db.nftTransferHistoryStore.remove(
      {
        walletId: nftTransactionHistory.walletId,
        nftQuery: nftTransactionHistory.nftQuery,
      },
      { multi: true },
    );

    return this.db.nftTransferHistoryStore.insert<NftTransactionHistory>(nftTransactionHistory); */
  }

  // eslint-disable-next-line
  public async retrieveNFTTransferHistory(walletId: string, nftQuery: NftQueryParams) {
    const nftTxRecords = await this.db.commonTransactionStore.find<NftTransferRecord>({
      walletId,
      txType: 'nftTransfer',
    });

    const nftQueryParam = await this.db.commonAttributeStore.findOne<NftAttributesRecord>({
      type: 'nft',
      walletId,
    });

    return {
      transfers: nftTxRecords.map(record => record.txData),
      walletId,
      nftQuery: nftQueryParam.customParams.nftQuery,
    } as NftTransactionHistory;

    // @deprecated
    // return this.db.nftTransferHistoryStore.findOne<NftTransactionHistory>({
    //   walletId,
    //   nftQuery,
    // });
  }

  // eslint-disable-next-line
  public async saveBridgeTransactions(bridgeTransactions: BridgeTransactionHistoryList) {
    if (!bridgeTransactions) {
      return Promise.resolve();
    }

    // Save into new transaction store
    const ibcTxRecords: IBCTransactionRecord[] = bridgeTransactions.transactions.map(tx => {
      return {
        walletId: bridgeTransactions.walletId,
        txType: 'ibc',
        txData: tx,
        txHash: tx.sourceTransactionId,
      };
    });
    await this.insertCommonTransactionRecords(ibcTxRecords);

    // @deprecated
    /**
     *
    await this.db.bridgeTransactionStore.remove(
      { walletId: bridgeTransactions.walletId },
      { multi: true },
    );
    return this.db.bridgeTransactionStore.insert<BridgeTransactionHistoryList>(bridgeTransactions); */
  }

  public async retrieveAllBridgeTransactions(walletId: string) {
    const bridgeTxs = await this.db.commonTransactionStore.find<IBCTransactionRecord>({
      walletId,
      txType: 'ibc',
    } as IBCTransactionRecord);

    // Sort the txdata list by `blockTime` in descending
    const txDataList = _.orderBy(
      bridgeTxs.map(record => record.txData),
      'sourceBlockTime',
      'desc',
    );

    return {
      transactions: txDataList,
      walletId,
    } as BridgeTransactionHistoryList;

    // return this.db.bridgeTransactionStore.findOne<BridgeTransactionHistoryList>({
    // walletId,
    // });
  }

  // MARK: address book

  public async retrieveAllAddressBookContacts(walletId: string) {
    return this.db.addressBookStore.find<AddressBookContactModel>({ walletId });
  }

  public async retrieveAddressBookContacts(
    walletId: string,
    chainName: string,
    assetSymbol: string,
  ) {
    return this.db.addressBookStore
      .find<AddressBookContactModel>({
        walletId,
        chainName,
        assetSymbol,
      })
      .exec();
  }

  public async queryAddressBookContactCount(
    walletId: string,
    chainName: string,
    assetSymbol: string,
  ) {
    return this.db.addressBookStore.count({ walletId, assetSymbol, chainName });
  }

  public async queryAddressBookContact(
    walletId: string,
    chainName: string,
    assetSymbol: string,
    address: string,
  ) {
    return this.db.addressBookStore.findOne<AddressBookContactModel>({
      walletId,
      chainName,
      assetSymbol,
      address,
    });
  }

  public async insertAddressBookContact(contact: AddressBookContactModel) {
    return this.db.addressBookStore.insert({
      ...contact,
    });
  }

  public async updateAddressBookContact(
    _id: string,
    chainName: string,
    assetSymbol: string,
    label: string,
    address: string,
    memo: string,
  ) {
    return this.db.addressBookStore.update(
      { _id },
      {
        $set: {
          chainName,
          assetSymbol,
          label,
          address,
          memo,
        },
      },
    );
  }

  public async removeAddressBookContact(_id: string) {
    return this.db.addressBookStore.remove({ _id }, {});
  }

  /**
   * record {CommonTransactionRecord}   */
  public async insertCommonTransactionRecord(record: CommonTransactionRecord) {
    return await this.insertCommonTransactionRecords([record]);
  }

  // eslint-disable-next-line
  public async insertCommonTransactionRecords(records: CommonTransactionRecord[]) {
    if (records.length === 0) {
      return Promise.resolve();
    }

    const removeQueries = records.map(async record => {
      return this.db.commonTransactionStore.remove(
        {
          txHash: record.txHash,
          walletId: record.walletId,
          txType: record.txType,
        },
        {},
      );
    });

    // Removing documents (Profiled time: 37ms)
    await Promise.allSettled([...removeQueries]);

    // inserting documents(Profile time: 35ms)
    await this.db.commonTransactionStore.insert<CommonTransactionRecord[]>(records);
  }

  /**
   * This function `upserts` the attributes to the database
   * @param attributeRecord
   */
  public async updateCommonAttributes(attributeRecord: CommonAttributesRecord) {
    await this.db.commonAttributeStore.update<CommonAttributesRecord>(
      {
        walletId: attributeRecord.walletId,
        type: attributeRecord.type,
      },
      {
        $set: attributeRecord,
      },
      {
        upsert: true,
        returnUpdatedDocs: true,
      },
    );
  }
}
