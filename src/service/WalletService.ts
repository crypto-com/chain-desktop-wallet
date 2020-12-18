import { Wallet } from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';
import {
  APP_DB_NAMESPACE,
  DefaultAsset,
  DefaultWalletConfigs,
  Network,
  WalletConfig,
} from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { NodeRpcService } from './rpc/NodeRpcService';
import { TransactionSigner } from './signers/TransactionSigner';
import { Session } from '../models/Session';
import {
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './signers/TransactionSupported';
import { cryptographer } from '../crypto/Cryptographer';
import { secretStoreService } from '../storage/SecretStoreService';
import { AssetMarketPrice, UserAsset } from '../models/UserAsset';
import { croMarketPriceApi } from './rpc/MarketApi';
import {
  RewardTransaction,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
} from '../models/Transaction';

export interface TransferRequest {
  toAddress: string;
  amount: string;
  memo: string;
  decryptedPhrase: string;
  asset: UserAsset;
}

export interface DelegationRequest {
  validatorAddress: string;
  amount: string;
  memo: string;
  asset: UserAsset;
  decryptedPhrase: string;
}

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
  }

  public async sendTransfer(transferRequest: TransferRequest) {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
    } = await this.prepareTransaction();

    const scaledAmount = this.getScaledAmount(transferRequest.amount, transferRequest.asset);

    const transfer: TransferTransactionUnsigned = {
      fromAddress: currentSession.wallet.address,
      toAddress: transferRequest.toAddress,
      amount: String(scaledAmount),
      memo: transferRequest.memo,
      accountNumber,
      accountSequence,
    };

    const signedTxHex = await transactionSigner.signTransfer(
      transfer,
      transferRequest.decryptedPhrase,
    );
    const transactionHash = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.syncData(currentSession);
    return transactionHash;
  }

  // eslint-disable-next-line class-methods-use-this
  private getScaledAmount(amount: string, asset: UserAsset): number {
    return Number(amount) * 10 ** asset.decimals;
  }

  public async sendDelegateTransaction(delegationRequest: DelegationRequest) {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
    } = await this.prepareTransaction();

    const delegationAmountScaled = this.getScaledAmount(
      delegationRequest.amount,
      delegationRequest.asset,
    );
    const delegateTransaction: DelegateTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: delegationRequest.validatorAddress,
      amount: String(delegationAmountScaled),
      memo: delegationRequest.memo,
      accountNumber,
      accountSequence,
    };

    const signedTxHex = await transactionSigner.signDelegateTx(
      delegateTransaction,
      delegationRequest.decryptedPhrase,
    );
    const transactionHash = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.syncData(currentSession);
    return transactionHash;
  }

  public async sendStakingRewardWithdrawalTx(
    delegatorAddress: string,
    validatorAddress: string,
    amount: string,
    memo: string,
    decryptedPhrase: string,
  ) {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      transactionSigner,
    } = await this.prepareTransaction();

    const withdrawStakingReward: WithdrawStakingRewardUnsigned = {
      delegatorAddress,
      validatorAddress,
      memo,
      accountNumber,
      accountSequence,
    };

    const signedTxHex = await transactionSigner.signWithdrawStakingRewardTx(
      withdrawStakingReward,
      decryptedPhrase,
    );
    return nodeRpc.broadcastTransaction(signedTxHex);
  }

  public async prepareTransaction() {
    const currentSession = await this.storageService.retrieveCurrentSession();

    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    const accountNumber = await nodeRpc.fetchAccountNumber(currentSession.wallet.address);
    const accountSequence = await nodeRpc.loadSequenceNumber(currentSession.wallet.address);

    const transactionSigner = new TransactionSigner(currentSession.wallet.config);

    return {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public supportedConfigs(): WalletConfig[] {
    return [
      DefaultWalletConfigs.TestNetConfig,
      DefaultWalletConfigs.MainNetConfig,
      DefaultWalletConfigs.CustomDevNet,
    ];
  }

  // Create a new wallet and persist it on the db
  public async createAndSaveWallet(createOptions: WalletCreateOptions): Promise<Wallet> {
    const newWallet = WalletCreator.create(createOptions);
    await this.persistWallet(newWallet);
    return newWallet;
  }

  public async persistInitialAsset(walletId: string, network: Network) {
    const defaultAsset: UserAsset = {
      ...DefaultAsset(network),
      walletId,
    };

    await this.storageService.saveAsset(defaultAsset);
  }

  // Import or restore wallet and persist it on the db
  public async restoreAndSaveWallet(importOptions: WalletImportOptions): Promise<Wallet> {
    const importedWallet = WalletImporter.import(importOptions);
    await this.persistWallet(importedWallet);
    return importedWallet;
  }

  // eslint-disable-next-line class-methods-use-this
  public async restoreWallet(importOptions: WalletImportOptions): Promise<Wallet> {
    return WalletImporter.import(importOptions);
  }

  // Load all persisted wallets
  public async retrieveAllWallets(): Promise<Wallet[]> {
    const wallets = await this.storageService.retrieveAllWallets();
    if (!wallets) {
      return [];
    }
    return wallets.map(
      data =>
        new Wallet(data.identifier, data.name, data.address, data.config, data.encryptedPhrase),
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
    await this.persistInitialAsset(wallet.identifier, wallet.config.network);
  }

  public async findWalletByIdentifier(identifier: string): Promise<Wallet> {
    return this.storageService.findWalletByIdentifier(identifier);
  }

  public async setCurrentSession(session: Session): Promise<void> {
    await this.storageService.setSession(session);
    return this.syncData(session);
  }

  public async fetchAndUpdateBalances(session: Session | null = null) {
    const currentSession =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }
    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets(currentSession);

    if (!assets || assets.length === 0) {
      return;
    }

    await Promise.all(
      assets.map(async asset => {
        const baseDenomination = currentSession.wallet.config.network.coin.baseDenom;
        try {
          asset.balance = await nodeRpc.loadAccountBalance(
            currentSession.wallet.address,
            baseDenomination,
          );
          asset.stakedBalance = await nodeRpc.loadStakingBalance(
            currentSession.wallet.address,
            baseDenomination,
          );
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('BALANCE_FETCH_ERROR', { asset });
        } finally {
          await this.storageService.saveAsset(asset);
        }
      }),
    );
  }

  public async fetchAndUpdateTransactions(session: Session | null = null) {
    const currentSession =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }

    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
    const baseDenomination = currentSession.wallet.config.network.coin.baseDenom;

    const delegations = await nodeRpc.fetchDelegationBalance(
      currentSession.wallet.address,
      baseDenomination,
    );

    const rewards = await nodeRpc.fetchStakingRewards(
      currentSession.wallet.address,
      baseDenomination,
    );

    const walletId = currentSession.wallet.identifier;

    await this.saveDelegationsList({
      totalBalance: delegations.totalBalance,
      transactions: delegations.transactions,
      walletId,
    });

    await this.saveRewards({
      transactions: rewards,
      walletId,
    });
  }

  public async retrieveCurrentWalletAssets(currentSession: Session): Promise<UserAsset[]> {
    const assets = await this.storageService.retrieveAssetsByWallet(
      currentSession.wallet.identifier,
    );

    return assets.map(data => {
      const asset: UserAsset = { ...data };
      return asset;
    });
  }

  public async retrieveDefaultWalletAsset(currentSession: Session): Promise<UserAsset> {
    return (await this.retrieveCurrentWalletAssets(currentSession))[0];
  }

  public async loadAndSaveAssetPrices(session: Session | null = null) {
    const currentSession =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }

    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets(currentSession);

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

  public async syncData(session: Session | null = null): Promise<void> {
    try {
      await this.fetchAndUpdateBalances(session);
      return this.loadAndSaveAssetPrices(session);
      // eslint-disable-next-line no-empty
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SYNC_ERROR', e);
      return Promise.resolve();
    }
  }

  public async syncTransactionsData(session: Session | null = null): Promise<void> {
    try {
      return await this.fetchAndUpdateTransactions(session);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SYNC_ERROR', e);
      return Promise.resolve();
    }
  }

  public async encryptWalletAndSetSession(key: string, wallet: Wallet): Promise<void> {
    const initialVector = await cryptographer.generateIV();
    const encryptionResult = await cryptographer.encrypt(
      wallet.encryptedPhrase,
      key,
      initialVector,
    );
    wallet.encryptedPhrase = encryptionResult.cipher;

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

  public async retrieveAllDelegations(walletId: string): Promise<StakingTransactionData[]> {
    const stakingTransactionList: StakingTransactionList = await this.storageService.retrieveAllStakingTransactions(
      walletId,
    );
    return stakingTransactionList.transactions.map(data => {
      const stakingTransaction: StakingTransactionData = { ...data };
      return stakingTransaction;
    });
  }

  public async retrieveAllRewards(walletId: string): Promise<RewardTransaction[]> {
    const rewardTransactionList: RewardTransactionList = await this.storageService.retrieveAllRewards(
      walletId,
    );
    return rewardTransactionList.transactions.map(data => {
      const rewardTransaction: RewardTransaction = { ...data };
      return rewardTransaction;
    });
  }
}

export const walletService = new WalletService();
