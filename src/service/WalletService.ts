import axios from 'axios';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  reconstructCustomConfig,
  SettingsDataUpdate,
  Wallet,
} from '../models/Wallet';
import {
  APP_DB_NAMESPACE,
  DefaultWalletConfigs,
  NOT_KNOWN_YET_VALUE,
  WalletConfig,
} from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { NodeRpcService } from './rpc/NodeRpcService';
import { Session } from '../models/Session';
import { cryptographer } from '../crypto/Cryptographer';
import { secretStoreService } from '../storage/SecretStoreService';
import { AssetCreationType, AssetMarketPrice, UserAsset, UserAssetType } from '../models/UserAsset';
import {
  BroadCastResult,
  CommonTransactionRecord,
  NftAccountTransactionData,
  NftDenomModel,
  NftModel,
  ProposalModel,
  RewardsBalances,
  RewardTransactionData,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  TransferTransactionData,
  TransferTransactionList,
  UnbondingDelegationData,
  UnbondingDelegationList,
  ValidatorModel,
} from '../models/Transaction';
import { ChainIndexingAPI } from './rpc/ChainIndexingAPI';
import { LEDGER_WALLET_TYPE } from './LedgerService';
import {
  BridgeTransferRequest,
  DelegationRequest,
  NFTDenomIssueRequest,
  NFTMintRequest,
  NFTTransferRequest,
  RedelegationRequest,
  TransferRequest,
  UndelegationRequest,
  VoteRequest,
  WithdrawStakingRewardRequest,
} from './TransactionRequestModels';
import { FinalTallyResult } from './rpc/NodeRpcModels';
import { capitalizeFirstLetter } from '../utils/utils';
import { WalletBuiltResult, WalletOps } from './WalletOps';
import { STATIC_ASSET_COUNT } from '../config/StaticAssets';
import { StorageService } from '../storage/StorageService';
import { TransactionPrepareService } from './TransactionPrepareService';
import { TransactionHistoryService } from './TransactionHistoryService';
import { TransactionSenderService } from './TransactionSenderService';

class WalletService {
  public readonly BROADCAST_TIMEOUT_CODE = -32603;

  public readonly storageService: StorageService;

  public readonly transactionPrepareService: TransactionPrepareService;

  private readonly txHistoryManager: TransactionHistoryService;

  private readonly txSenderManager: TransactionSenderService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
    this.transactionPrepareService = new TransactionPrepareService(this.storageService);
    this.txHistoryManager = new TransactionHistoryService(this.storageService);
    this.txSenderManager = new TransactionSenderService(
      this.storageService,
      this.transactionPrepareService,
      this.txHistoryManager,
    );
  }

  public async sendBridgeTransaction(bridgeTransferRequest: BridgeTransferRequest) {
    return await this.txSenderManager.sendBridgeTransaction(bridgeTransferRequest);
  }

  public async sendTransfer(transferRequest: TransferRequest): Promise<BroadCastResult> {
    return await this.txSenderManager.sendTransfer(transferRequest);
  }

  public async sendDelegateTransaction(
    delegationRequest: DelegationRequest,
  ): Promise<BroadCastResult> {
    return await this.txSenderManager.sendDelegateTransaction(delegationRequest);
  }

  public async sendUnDelegateTransaction(
    undelegationRequest: UndelegationRequest,
  ): Promise<BroadCastResult> {
    return await this.txSenderManager.sendUnDelegateTransaction(undelegationRequest);
  }

  public async sendReDelegateTransaction(
    redelegationRequest: RedelegationRequest,
  ): Promise<BroadCastResult> {
    return await this.txSenderManager.sendReDelegateTransaction(redelegationRequest);
  }

  public async sendStakingRewardWithdrawalTx(
    rewardWithdrawRequest: WithdrawStakingRewardRequest,
  ): Promise<BroadCastResult> {
    return await this.txSenderManager.sendStakingRewardWithdrawalTx(rewardWithdrawRequest);
  }

  public async sendVote(voteRequest: VoteRequest): Promise<BroadCastResult> {
    return await this.txSenderManager.sendVote(voteRequest);
  }

  public async sendNFT(nftTransferRequest: NFTTransferRequest): Promise<BroadCastResult> {
    return await this.txSenderManager.sendNFT(nftTransferRequest);
  }

  public async broadcastMintNFT(nftMintRequest: NFTMintRequest): Promise<BroadCastResult> {
    return await this.txSenderManager.sendMintNFT(nftMintRequest);
  }

  public async broadcastNFTDenomIssueTx(
    nftDenomIssueRequest: NFTDenomIssueRequest,
  ): Promise<BroadCastResult> {
    return await this.txSenderManager.sendNFTDenomIssueTx(nftDenomIssueRequest);
  }

  public async loadAndSaveAssetPrices(session: Session | null = null) {
    return await this.txHistoryManager.loadAndSaveAssetPrices(session);
  }

  public async syncAll(session: Session | null = null) {
    const currentSession =
      session == null ? await this.storageService.retrieveCurrentSession() : session;

    if (!currentSession) {
      return;
    }
    // Stop background fetch tasks if the wallet configuration network is not live yet
    if (currentSession.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return;
    }

    await Promise.all([
      this.syncBalancesData(currentSession),
      this.syncTransactionsData(currentSession),
      this.fetchAndSaveNFTs(currentSession),
      // this.fetchIBCAssets(currentSession),
    ]);
  }

  // eslint-disable-next-line class-methods-use-this
  public supportedConfigs(): WalletConfig[] {
    return [
      DefaultWalletConfigs.MainNetConfig,
      DefaultWalletConfigs.TestNetCroeseid4Config,
      DefaultWalletConfigs.CustomDevNet,
    ];
  }

  // Import or restore wallet and persist it on the db
  // public async restoreAndSaveWallet(importOptions: WalletImportOptions): Promise<Wallet> {
  //   const importedWallet = new WalletImporter(importOptions).import();
  //   await this.persistWallet(importedWallet.wallet);
  //   await this.saveAssets(importedWallet.assets)
  //   return importedWallet.wallet;
  // }

  // eslint-disable-next-line class-methods-use-this
  public async restoreWallet(importOptions: WalletImportOptions): Promise<WalletBuiltResult> {
    return new WalletImporter(importOptions).import();
  }

  // Load all persisted wallets
  public async retrieveAllWallets(): Promise<Wallet[]> {
    const wallets = await this.storageService.retrieveAllWallets();
    if (!wallets) {
      return [];
    }
    return wallets
      .filter(wallet => wallet.hasBeenEncrypted)
      .map(
        data =>
          new Wallet(
            data.identifier,
            data.name,
            data.address,
            data.config,
            data.encryptedPhrase,
            data.hasBeenEncrypted,
            data.walletType,
            data.addressIndex,
          ),
      );
  }

  // This is used to check whether the user should be shown the welcome screen or being redirected straight to their home screen
  public async hasWalletBeenCreated(): Promise<boolean> {
    const allWallets = await this.retrieveAllWallets();
    return allWallets.length > 0;
  }

  // Save freshly created or imported wallet
  public async persistWallet(wallet: Wallet) {
    await this.storageService.saveWallet(wallet);
  }

  public async deleteWallet(walletIdentifier: string) {
    await this.storageService.deleteWallet(walletIdentifier);
  }

  public async updateWalletNodeConfig(nodeData: SettingsDataUpdate) {
    return this.storageService.updateWalletSettings(nodeData);
  }

  public async updateDefaultMemoDisabledSettings(
    disableDefaultMemoSettings: DisableDefaultMemoSettings,
  ) {
    return this.storageService.updateDisabledDefaultMemo(disableDefaultMemoSettings);
  }

  public async updateGADisabledSettings(disableGASettings: DisableGASettings) {
    return this.storageService.updateDisabledGA(disableGASettings);
  }

  public async updateGeneralSettingsPropagation(
    enableGeneralSettingsPropagation: EnableGeneralSettingsPropagation,
  ) {
    return this.storageService.updateGeneralSettingsPropagation(
      enableGeneralSettingsPropagation.networkName,
      enableGeneralSettingsPropagation.enabledGeneralSettings,
    );
  }

  public async findWalletByIdentifier(identifier: string): Promise<Wallet> {
    return this.storageService.findWalletByIdentifier(identifier);
  }

  public async setCurrentSession(session: Session): Promise<number> {
    return await this.storageService.setSession(session);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars,class-methods-use-this
  public async fetchIBCAssets(currentSession: Session) {
    // const currentSession: Session = await this.storageService.retrieveCurrentSession()
    if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve(null);
    }
    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
    const ibcAssets: UserAsset[] = await nodeRpc.loadIBCAssets(currentSession);

    const persistedAssets = await ibcAssets.map(async ibcAsset => {
      const denomTrace = await nodeRpc.getIBCAssetTrace(ibcAsset.ibcDenomHash!);
      const baseDenom = capitalizeFirstLetter(denomTrace.base_denom);

      ibcAsset.denomTracePath = denomTrace.path;
      ibcAsset.symbol = baseDenom;
      ibcAsset.mainnetSymbol = baseDenom;
      ibcAsset.name = baseDenom;
      ibcAsset.walletId = currentSession.wallet.identifier;
      await this.storageService.saveAsset(ibcAsset);
      return ibcAsset;
    });

    // eslint-disable-next-line no-console
    console.log('IBC_PERSISTED_ASSETS', persistedAssets);

    return persistedAssets;
  }

  public async saveAssets(userAssets: UserAsset[]) {
    // eslint-disable-next-line no-console
    console.log('SAVING_ASSETS', { userAssets });
    // eslint-disable-next-line no-restricted-syntax

    await userAssets.map(async asset => {
      await this.storageService.saveAsset(asset);
    });
  }

  public async getAllNFTAccountTxs(
    currentSession: Session,
  ): Promise<Array<NftAccountTransactionData>> {
    const nftAccountTxs = await this.storageService.retrieveAllNFTAccountTransactions(
      currentSession.wallet.identifier,
    );
    if (!nftAccountTxs) {
      return [];
    }
    return nftAccountTxs.transactions;
  }

  public async fetchAndSaveValidators(currentSession: Session) {
    await this.txHistoryManager.fetchAndSaveValidators(currentSession);
  }

  public async fetchAndSaveNFTs(currentSession: Session) {
    await this.txHistoryManager.fetchAndSaveNFTs(currentSession);
  }

  public async fetchAndSaveNFTAccountTxs(currentSession: Session) {
    await this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession);
  }

  public async fetchAndSaveProposals(currentSession: Session) {
    await this.txHistoryManager.fetchAndSaveProposals(currentSession);
  }

  public async retrieveWalletAssets(walletIdentifier: string): Promise<UserAsset[]> {
    const assets = await this.storageService.retrieveAssetsByWallet(walletIdentifier);
    return assets
      .filter(asset => asset.assetType !== UserAssetType.IBC)
      .map(data => {
        const asset: UserAsset = { ...data };
        return asset;
      });
  }

  public async retrieveCurrentWalletAssets(currentSession: Session): Promise<UserAsset[]> {
    const assets = await this.storageService.retrieveAssetsByWallet(
      currentSession.wallet.identifier,
    );

    return assets
      .filter(asset => asset.assetType !== UserAssetType.IBC)
      .map(data => {
        const asset: UserAsset = { ...data };
        return asset;
      });
  }

  public async retrieveDefaultWalletAsset(currentSession: Session): Promise<UserAsset> {
    const allWalletAssets: UserAsset[] = await this.retrieveCurrentWalletAssets(currentSession);
    // eslint-disable-next-line no-console
    console.log('ALL_WALLET_ASSETS : ', allWalletAssets);

    for (let i = 0; i < allWalletAssets.length; i++) {
      if (!allWalletAssets[i].isSecondaryAsset) {
        return allWalletAssets[i];
      }
    }

    return allWalletAssets[0];
  }

  public async retrieveAllAssetsPrices(currency: string): Promise<Map<string, AssetMarketPrice>> {
    const assetsPrices = new Map<string, AssetMarketPrice>();
    const prices = await this.storageService.retrieveAllAssetsPrices(currency);
    prices.forEach(data => {
      // eslint-disable-next-line no-underscore-dangle
      assetsPrices.set(data._id, data);
    });
    return assetsPrices;
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

  public async syncBalancesData(session: Session | null = null): Promise<any> {
    // Stop background fetch tasks if the wallet configuration network is not live yet
    if (session?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve();
    }
    try {
      return await Promise.all([
        await this.txHistoryManager.fetchAndUpdateBalances(session),
        await this.txHistoryManager.loadAndSaveAssetPrices(session),
      ]);
      // eslint-disable-next-line no-empty
    } catch (e) {
      // eslint-disable-next-line no-console
      // console.log('SYNC_ERROR', e);
      return Promise.resolve();
    }
  }

  public async syncTransactionsData(session: Session | null = null): Promise<void> {
    try {
      return await this.txHistoryManager.fetchAndUpdateTransactions(session);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SYNC_ERROR', e);
      return Promise.resolve();
    }
  }

  public async syncTransactionRecordsByAsset(
    session: Session,
    asset: UserAsset,
  ): Promise<CommonTransactionRecord[]> {
    try {
      return await this.txHistoryManager.fetchAndSaveTransfersByAsset(session, asset);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SYNC_ERROR', e);
      return Promise.resolve([]);
    }
  }

  public async encryptWalletAndSetSession(key: string, walletOriginal: Wallet): Promise<void> {
    const wallet = JSON.parse(JSON.stringify(walletOriginal));
    const initialVector = await cryptographer.generateIV();
    const encryptionResult = await cryptographer.encrypt(
      wallet.encryptedPhrase,
      key,
      initialVector,
    );
    wallet.encryptedPhrase = encryptionResult.cipher;
    wallet.hasBeenEncrypted = true;

    await this.persistWallet(wallet);
    await secretStoreService.persistEncryptedPhrase(wallet.identifier, encryptionResult);
    await this.setCurrentSession(new Session(wallet));
  }

  public async retrieveCurrentSession(): Promise<Session> {
    return this.storageService.retrieveCurrentSession();
  }

  public async saveDelegationsList(stakingTransactions: StakingTransactionList) {
    return this.storageService.saveStakingTransactions(stakingTransactions);
  }

  public async saveRewards(rewardTransactions: RewardTransactionList) {
    return this.storageService.saveRewardList(rewardTransactions);
  }

  public async saveUnbondingDelegationsList(unbondingDelegations: UnbondingDelegationList) {
    return this.storageService.saveUnbondingDelegations(unbondingDelegations);
  }

  public async saveTransfers(transferTransactions: TransferTransactionList) {
    return this.storageService.saveTransferTransactions(transferTransactions);
  }

  public async retrieveAllDelegations(walletId: string): Promise<StakingTransactionData[]> {
    const stakingTransactionList: StakingTransactionList = await this.storageService.retrieveAllStakingTransactions(
      walletId,
    );
    if (!stakingTransactionList) {
      return [];
    }
    return stakingTransactionList.transactions.map(data => {
      const stakingTransaction: StakingTransactionData = { ...data };
      return stakingTransaction;
    });
  }

  public async retrieveAllRewards(walletId: string): Promise<RewardTransactionData[]> {
    const rewardTransactionList: RewardTransactionList = await this.storageService.retrieveAllRewards(
      walletId,
    );

    if (!rewardTransactionList) {
      return [];
    }

    return rewardTransactionList.transactions.map(data => {
      const rewardTransaction: RewardTransactionData = { ...data };
      return rewardTransaction;
    });
  }

  public async retrieveRewardsBalances(walletId: string): Promise<RewardsBalances> {
    const rewards: RewardTransactionList = await this.storageService.retrieveAllRewards(walletId);

    if (!rewards) {
      return {
        claimedRewardsBalance: '0',
        estimatedApy: '0',
        estimatedRewardsBalance: '0',
        totalBalance: '0',
      };
    }

    return {
      claimedRewardsBalance: rewards.claimedRewardsBalance!,
      estimatedApy: rewards.estimatedApy!,
      estimatedRewardsBalance: rewards.estimatedRewardsBalance!,
      totalBalance: rewards.totalBalance,
    };
  }

  public async retrieveAllUnbondingDelegations(
    walletId: string,
  ): Promise<UnbondingDelegationData[]> {
    const unbondingDelegationList: UnbondingDelegationList = await this.storageService.retrieveAllUnbondingDelegations(
      walletId,
    );

    if (!unbondingDelegationList) {
      return [];
    }

    return unbondingDelegationList.delegations.map(data => {
      const unbondingDelegation: UnbondingDelegationData = { ...data };
      return unbondingDelegation;
    });
  }

  public async retrieveAllTransfers(
    walletId: string,
    currentAsset?: UserAsset,
  ): Promise<TransferTransactionData[]> {
    const transactionList: TransferTransactionList = await this.storageService.retrieveAllTransferTransactions(
      walletId,
      currentAsset?.identifier,
    );

    if (!transactionList) {
      return [];
    }

    return transactionList.transactions.map(data => {
      const transactionData: TransferTransactionData = { ...data };
      return transactionData;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  public async checkNodeIsLive(nodeUrl: string): Promise<boolean> {
    try {
      await axios.head(nodeUrl);
      return true;
    } catch (error) {
      if (error && error.response) {
        const { status } = error.response;
        return !(status >= 400 && status < 500);
      }
    }

    return false;
  }

  public getSelectedNetwork(network, props) {
    let selectedNetworkConfig = this.supportedConfigs().find(config => config.name === network);

    // If the dev-net custom network was selected, we pass the values that were input in the dev-net config UI fields
    if (selectedNetworkConfig?.name === DefaultWalletConfigs.CustomDevNet.name) {
      let customDevnetConfig;
      if (props.networkConfig) {
        customDevnetConfig = reconstructCustomConfig(props.networkConfig);
        selectedNetworkConfig = customDevnetConfig;

        // eslint-disable-next-line no-console
        console.log('props.networkConfig', selectedNetworkConfig);
      }
    }
    return selectedNetworkConfig;
  }

  public async retrieveTopValidators(chainId: string): Promise<ValidatorModel[]> {
    const validatorSet = await this.storageService.retrieveAllValidators(chainId);
    if (!validatorSet) {
      return [];
    }
    return validatorSet.validators;
  }

  public async retrieveProposals(chainId: string): Promise<ProposalModel[]> {
    const proposalSet = await this.storageService.retrieveAllProposals(chainId);
    if (!proposalSet) {
      return [];
    }
    return proposalSet.proposals;
  }

  public async retrieveNFTs(walletID: string): Promise<NftModel[]> {
    const nftSet = await this.storageService.retrieveAllNfts(walletID);
    if (!nftSet) {
      return [];
    }
    return nftSet.nfts;
  }

  public async getDenomIdData(denomId: string): Promise<NftDenomModel | null> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve(null);
    }
    try {
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const nftDenomData = await chainIndexAPI.fetchNftDenomData(denomId);

      return nftDenomData.result;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING NFT denom data', e);

      return null;
    }
  }

  public async checkIfWalletNeedAssetCreation(session: Session) {
    const { wallet } = session;
    const existingStaticAssets = await this.storageService.fetchAssetByCreationType(
      AssetCreationType.STATIC,
      wallet.identifier,
    );
    const needAssetsCreation = existingStaticAssets.length < STATIC_ASSET_COUNT;
    if (needAssetsCreation) {
      // eslint-disable-next-line no-console
      console.log('NEEDS_ASSETS_CREATIONS', {
        assets: existingStaticAssets,
        STATIC_ASSET_COUNT,
        walletID: wallet.identifier,
      });
    }
    return needAssetsCreation;
  }

  public async handleCurrentWalletAssetsMigration(
    phrase: string,
    session?: Session,
    tendermintAddress?: string,
    evmAddress?: string,
  ) {
    // 1. Check if current wallet has all expected static assets
    // 2. If static assets are missing, remove all existing non dynamic assets
    // 3. Prompt user password and re-create static assets on the fly
    // 4. Run sync all to synchronize all assets states

    const currentSession = session || (await this.storageService.retrieveCurrentSession());
    const { wallet } = currentSession;

    if (await this.checkIfWalletNeedAssetCreation(currentSession)) {
      await this.storageService.removeWalletAssets(wallet.identifier);

      const walletOps = new WalletOps();
      const assetGeneration = walletOps.generate(wallet.config, wallet.identifier, phrase);

      if (currentSession?.wallet.walletType === LEDGER_WALLET_TYPE) {
        if (tendermintAddress !== '' && evmAddress !== '') {
          const tendermintAsset = assetGeneration.initialAssets.filter(
            asset => asset.assetType === UserAssetType.TENDERMINT,
          )[0];
          tendermintAsset.address = tendermintAddress;
          const evmAsset = assetGeneration.initialAssets.filter(
            asset => asset.assetType === UserAssetType.EVM,
          )[0];
          evmAsset.address = evmAddress;
        } else {
          // eslint-disable-next-line no-console
          console.log('FAILED_TO_GET_LEDGER_ADDRESSES');
          throw TypeError('Failed to get Ledger addresses.');
        }
      }

      await this.saveAssets(assetGeneration.initialAssets);

      const activeAsset = assetGeneration.initialAssets[0];
      const newSession = new Session(wallet, activeAsset);
      await this.setCurrentSession(newSession);

      await this.syncAll(newSession);
    }
  }

  public async loadLatestProposalTally(proposalID: string): Promise<FinalTallyResult | null> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve(null);
    }
    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
    return nodeRpc.loadLatestTally(proposalID);
  }
}

export const walletService = new WalletService();
