import axios from 'axios';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  reconstructCustomConfig,
  SettingsDataUpdate,
  Wallet,
} from '../models/Wallet';
import { StorageService } from '../storage/StorageService';
import {
  APP_DB_NAMESPACE,
  DEFAULT_CLIENT_MEMO,
  DefaultAsset,
  DefaultWalletConfigs,
  Network,
  NOT_KNOWN_YET_VALUE,
  WalletConfig,
} from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { NodeRpcService } from './rpc/NodeRpcService';
import { TransactionSigner } from './signers/TransactionSigner';
import { LedgerTransactionSigner } from './signers/LedgerTransactionSigner';
import { Session } from '../models/Session';
import {
  DelegateTransactionUnsigned,
  NFTMintUnsigned,
  NFTTransferUnsigned,
  RedelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  UndelegateTransactionUnsigned,
  VoteTransactionUnsigned,
  WithdrawStakingRewardUnsigned,
} from './signers/TransactionSupported';
import { cryptographer } from '../crypto/Cryptographer';
import { secretStoreService } from '../storage/SecretStoreService';
import { AssetMarketPrice, UserAsset } from '../models/UserAsset';
import { croMarketPriceApi } from './rpc/MarketApi';
import {
  BroadCastResult,
  NftAccountTransactionData,
  NftModel,
  NftQueryParams,
  NftTransferModel,
  ProposalModel,
  ProposalStatuses,
  RewardTransaction,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  TransferTransactionData,
  TransferTransactionList,
  ValidatorModel,
} from '../models/Transaction';
import { ChainIndexingAPI } from './rpc/ChainIndexingAPI';
import { getBaseScaledAmount } from '../utils/NumberUtils';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from './LedgerService';
import { ISignerProvider } from './signers/SignerProvider';
import {
  DelegationRequest,
  NFTMintRequest,
  NFTTransferRequest,
  RedelegationRequest,
  TransferRequest,
  UndelegationRequest,
  VoteRequest,
  WithdrawStakingRewardRequest,
} from './TransactionRequestModels';
import { FinalTallyResult } from './rpc/NodeRpcModels';
import { sleep } from '../utils/utils';

class WalletService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
  }

  public readonly BROADCAST_TIMEOUT_CODE = -32603;

  public async sendTransfer(transferRequest: TransferRequest): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const scaledBaseAmount = getBaseScaledAmount(transferRequest.amount, transferRequest.asset);
    const fromAddress = currentSession.wallet.address;
    const transfer: TransferTransactionUnsigned = {
      fromAddress,
      toAddress: transferRequest.toAddress,
      amount: String(scaledBaseAmount),
      memo: transferRequest.memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';

    if (transferRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signTransfer(
        transfer,
        transferRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signTransfer(transfer, transferRequest.decryptedPhrase);
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

    await Promise.all([
      await this.fetchAndSaveTransfers(currentSession),
      await this.fetchAndUpdateBalances(currentSession),
    ]);

    return broadCastResult;
  }

  public async sendDelegateTransaction(
    delegationRequest: DelegationRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const delegationAmountScaled = getBaseScaledAmount(
      delegationRequest.amount,
      delegationRequest.asset,
    );

    let { memo } = delegationRequest;
    if (!memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      memo = DEFAULT_CLIENT_MEMO;
    }

    const delegateTransaction: DelegateTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: delegationRequest.validatorAddress,
      amount: String(delegationAmountScaled),
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;
    if (delegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signDelegateTx(
        delegateTransaction,
        delegationRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signDelegateTx(
        delegateTransaction,
        delegationRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.fetchAndUpdateBalances(currentSession),
      await this.fetchAndSaveDelegations(nodeRpc, currentSession),
    ]);

    return broadCastResult;
  }

  public async sendUnDelegateTransaction(
    undelegationRequest: UndelegationRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const undelegationAmountScaled = getBaseScaledAmount(
      undelegationRequest.amount,
      undelegationRequest.asset,
    );

    let { memo } = undelegationRequest;
    if (!memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      memo = DEFAULT_CLIENT_MEMO;
    }

    const undelegateTransaction: UndelegateTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: undelegationRequest.validatorAddress,
      amount: undelegationAmountScaled,
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;
    if (undelegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signUndelegateTx(
        undelegateTransaction,
        undelegationRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signUndelegateTx(
        undelegateTransaction,
        undelegationRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.fetchAndUpdateBalances(currentSession),
      await this.fetchAndSaveDelegations(nodeRpc, currentSession),
    ]);

    return broadCastResult;
  }

  public async sendReDelegateTransaction(
    redelegationRequest: RedelegationRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const redelegationAmountScaled = getBaseScaledAmount(
      redelegationRequest.amount,
      redelegationRequest.asset,
    );
    let { memo } = redelegationRequest;
    if (!memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      memo = DEFAULT_CLIENT_MEMO;
    }

    const redelegateTransactionUnsigned: RedelegateTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      sourceValidatorAddress: redelegationRequest.validatorSourceAddress,
      destinationValidatorAddress: redelegationRequest.validatorDestinationAddress,
      amount: redelegationAmountScaled,
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;
    if (redelegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signRedelegateTx(
        redelegateTransactionUnsigned,
        redelegationRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signRedelegateTx(
        redelegateTransactionUnsigned,
        redelegationRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.fetchAndUpdateBalances(currentSession),
      await this.fetchAndSaveDelegations(nodeRpc, currentSession),
    ]);
    return broadCastResult;
  }

  public async sendVote(voteRequest: VoteRequest): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const voteTransactionUnsigned: VoteTransactionUnsigned = {
      option: voteRequest.voteOption,
      voter: currentSession.wallet.address,
      proposalID: voteRequest.proposalID,
      memo: voteRequest.memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';

    if (voteRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signVoteTransaction(
        voteTransactionUnsigned,
        voteRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signVoteTransaction(
        voteTransactionUnsigned,
        voteRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.fetchAndSaveProposals(currentSession);
    return broadCastResult;
  }

  public async sendNFT(nftTransferRequest: NFTTransferRequest): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const memo = !nftTransferRequest.memo ? DEFAULT_CLIENT_MEMO : nftTransferRequest.memo;

    const nftTransferUnsigned: NFTTransferUnsigned = {
      tokenId: nftTransferRequest.tokenId,
      denomId: nftTransferRequest.denomId,
      sender: nftTransferRequest.sender,
      recipient: nftTransferRequest.recipient,

      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';

    if (nftTransferRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signNFTTransfer(
        nftTransferUnsigned,
        nftTransferRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signNFTTransfer(
        nftTransferUnsigned,
        nftTransferRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

    // It takes a few seconds for the indexing service to sync latest NFT state
    await sleep(7_000);
    await Promise.all([
      this.fetchAndSaveNFTs(currentSession),
      this.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
    return broadCastResult;
  }

  public async broadcastMintNFT(nftMintRequest: NFTMintRequest): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const memo = !nftMintRequest.memo ? DEFAULT_CLIENT_MEMO : nftMintRequest.memo;

    const nftMintUnsigned: NFTMintUnsigned = {
      data: nftMintRequest.data,
      name: nftMintRequest.name,
      uri: nftMintRequest.uri,
      tokenId: nftMintRequest.tokenId,
      denomId: nftMintRequest.denomId,
      sender: nftMintRequest.sender,
      recipient: nftMintRequest.recipient,

      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';

    if (nftMintRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signNFTMint(
        nftMintUnsigned,
        nftMintRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signNFTMint(
        nftMintUnsigned,
        nftMintRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

    // It takes a few seconds for the indexing service to sync latest NFT state
    await sleep(5_000);
    await Promise.all([
      this.fetchAndSaveNFTs(currentSession),
      this.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
    return broadCastResult;
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
    ]);
  }

  public async sendStakingRewardWithdrawalTx(
    rewardWithdrawRequest: WithdrawStakingRewardRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const withdrawStakingReward: WithdrawStakingRewardUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: rewardWithdrawRequest.validatorAddress,
      memo: '',
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;

    if (rewardWithdrawRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signWithdrawStakingRewardTx(
        withdrawStakingReward,
        rewardWithdrawRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signWithdrawStakingRewardTx(
        withdrawStakingReward,
        rewardWithdrawRequest.decryptedPhrase,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.fetchAndSaveRewards(nodeRpc, currentSession),
      await this.fetchAndUpdateBalances(currentSession),
    ]);
    return broadCastResult;
  }

  public async prepareTransaction() {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const currentWallet = currentSession.wallet;

    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    const accountNumber = await nodeRpc.fetchAccountNumber(currentSession.wallet.address);
    const accountSequence = await nodeRpc.loadSequenceNumber(currentSession.wallet.address);

    const transactionSigner = new TransactionSigner(currentWallet.config);

    const signerProvider: ISignerProvider = createLedgerDevice();

    const tmpWalletConfig = currentWallet.config;

    const ledgerTransactionSigner = new LedgerTransactionSigner(
      // currentWallet.config,
      tmpWalletConfig,
      signerProvider,
      currentWallet.addressIndex,
    );
    return {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public supportedConfigs(): WalletConfig[] {
    return [
      DefaultWalletConfigs.MainNetConfig,
      DefaultWalletConfigs.TestNetConfig,
      DefaultWalletConfigs.TestNetCroeseid3,
      DefaultWalletConfigs.CustomDevNet,
    ];
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
    await this.persistInitialAsset(wallet.identifier, wallet.config.network);
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
    const currentSession: Session =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }

    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    await Promise.all([
      this.fetchAndSaveDelegations(nodeRpc, currentSession),
      this.fetchAndSaveRewards(nodeRpc, currentSession),
      this.fetchAndSaveTransfers(currentSession),
      this.fetchAndSaveValidators(currentSession),
      this.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
  }

  public async fetchAndSaveTransfers(currentSession: Session) {
    try {
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const transferTransactions = await chainIndexAPI.fetchAllTransferTransactions(
        currentSession.wallet.config.network.coin.baseDenom,
        currentSession.wallet.address,
      );

      await this.saveTransfers({
        transactions: transferTransactions,
        walletId: currentSession.wallet.identifier,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_TRANSFERS', e);
    }
  }

  public async fetchAndSaveNFTAccountTxs(currentSession: Session) {
    try {
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const nftAccountTransactionList = await chainIndexAPI.fetchAllAccountNFTsTransactions(
        currentSession.wallet.address,
      );

      await this.storageService.saveNFTAccountTransactions({
        transactions: nftAccountTransactionList.result,
        walletId: currentSession.wallet.identifier,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_SAVE_NFT_ACCOUNT_TXs', e);
    }
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

  public async fetchAndSaveRewards(nodeRpc: NodeRpcService, currentSession: Session) {
    try {
      const rewards = await nodeRpc.fetchStakingRewards(
        currentSession.wallet.address,
        currentSession.wallet.config.network.coin.baseDenom,
      );
      await this.saveRewards({
        transactions: rewards,
        walletId: currentSession.wallet.identifier,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_REWARDS', e);
    }
  }

  public async fetchAndSaveDelegations(nodeRpc: NodeRpcService, currentSession: Session) {
    try {
      const delegations = await nodeRpc.fetchDelegationBalance(
        currentSession.wallet.address,
        currentSession.wallet.config.network.coin.baseDenom,
      );
      await this.saveDelegationsList({
        totalBalance: delegations.totalBalance,
        transactions: delegations.transactions,
        walletId: currentSession.wallet.identifier,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_DELEGATIONS', e);
    }
  }

  public async fetchAndSaveValidators(currentSession: Session) {
    try {
      const validators = await this.getLatestTopValidators();
      await this.storageService.saveValidators({
        chainId: currentSession.wallet.config.network.chainId,
        validators,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_VALIDATORS', e);
    }
  }

  public async fetchAndSaveProposals(currentSession: Session) {
    try {
      const proposals = await this.getLatestProposals();
      await this.storageService.saveProposals({
        chainId: currentSession.wallet.config.network.chainId,
        proposals,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_SAVE_PROPOSALS', e);
    }
  }

  public async fetchAndSaveNFTs(currentSession: Session) {
    try {
      const nfts = await this.loadAllCurrentAccountNFTs();
      if (nfts === null) {
        return;
      }

      await this.storageService.saveNFTs({
        walletId: currentSession.wallet.identifier,
        nfts,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_SAVE_NFTS', e);
    }
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

  public async syncBalancesData(session: Session | null = null): Promise<any> {
    // Stop background fetch tasks if the wallet configuration network is not live yet
    if (session?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve();
    }
    try {
      return await Promise.all([
        await this.fetchAndUpdateBalances(session),
        await this.loadAndSaveAssetPrices(session),
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
      return await this.fetchAndUpdateTransactions(session);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('SYNC_ERROR', e);
      return Promise.resolve();
    }
  }

  public async encryptWalletAndSetSession(key: string, walletOriginal: Wallet): Promise<void> {
    const wallet = JSON.parse(JSON.stringify(walletOriginal));
    const addressprefix = wallet.config.network.addressPrefix;

    // fetch first address , ledger identifier
    if (wallet.walletType === LEDGER_WALLET_TYPE) {
      const device: ISignerProvider = createLedgerDevice();
      const address = await device.getAddress(wallet.addressIndex, addressprefix, false);
      wallet.address = address;
    }

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

  public async saveTransfers(rewardTransactions: TransferTransactionList) {
    return this.storageService.saveTransferTransactions(rewardTransactions);
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

  public async retrieveAllRewards(walletId: string): Promise<RewardTransaction[]> {
    const rewardTransactionList: RewardTransactionList = await this.storageService.retrieveAllRewards(
      walletId,
    );

    if (!rewardTransactionList) {
      return [];
    }

    return rewardTransactionList.transactions.map(data => {
      const rewardTransaction: RewardTransaction = { ...data };
      return rewardTransaction;
    });
  }

  public async retrieveAllTransfers(walletId: string): Promise<TransferTransactionData[]> {
    const transactionList: TransferTransactionList = await this.storageService.retrieveAllTransferTransactions(
      walletId,
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

  private async getLatestTopValidators(): Promise<ValidatorModel[]> {
    try {
      const currentSession = await this.storageService.retrieveCurrentSession();
      if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
        return Promise.resolve([]);
      }
      const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
      return nodeRpc.loadTopValidators();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING TOP VALIDATORS', e);
      return [];
    }
  }

  private async getLatestProposals(): Promise<ProposalModel[]> {
    try {
      const currentSession = await this.storageService.retrieveCurrentSession();
      if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
        return Promise.resolve([]);
      }
      const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
      return nodeRpc.loadProposals([
        ProposalStatuses.PROPOSAL_STATUS_VOTING_PERIOD,
        ProposalStatuses.PROPOSAL_STATUS_PASSED,
        ProposalStatuses.PROPOSAL_STATUS_FAILED,
        ProposalStatuses.PROPOSAL_STATUS_REJECTED,
      ]);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING PROPOSALS', e);
      return [];
    }
  }

  private async loadAllCurrentAccountNFTs(): Promise<NftModel[] | null> {
    try {
      const currentSession = await this.storageService.retrieveCurrentSession();
      if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
        return Promise.resolve([]);
      }
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const nftList = await chainIndexAPI.getAccountNFTList(currentSession.wallet.address);
      return await chainIndexAPI.getNftListMarketplaceData(nftList);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING NFTs', e);
      return null;
    }
  }

  public async loadNFTTransferHistory(nftQuery: NftQueryParams): Promise<NftTransferModel[]> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
      return Promise.resolve([]);
    }

    try {
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const nftTransferTransactions = await chainIndexAPI.getNFTTransferHistory(nftQuery);

      await this.storageService.saveNFTTransferHistory({
        transfers: nftTransferTransactions,
        walletId: currentSession.wallet.identifier,
        nftQuery,
      });

      return nftTransferTransactions;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING NFT Transfer history, returning DB data', e);
      const localTransferHistory = await this.storageService.retrieveNFTTransferHistory(
        currentSession.wallet.identifier,
        nftQuery,
      );
      if (!localTransferHistory) {
        return [];
      }
      return localTransferHistory.transfers;
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
