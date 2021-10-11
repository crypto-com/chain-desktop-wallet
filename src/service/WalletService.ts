import axios from 'axios';
import _ from 'lodash';
import { TransactionConfig } from 'web3-eth';
import Web3 from 'web3';
import {
  DisableDefaultMemoSettings,
  DisableGASettings,
  EnableGeneralSettingsPropagation,
  reconstructCustomConfig,
  SettingsDataUpdate,
  Wallet,
} from '../models/Wallet';
import {
  DEFAULT_CLIENT_MEMO,
  DefaultWalletConfigs,
  NOT_KNOWN_YET_VALUE,
  SECONDS_OF_YEAR,
  WalletConfig,
} from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { NodeRpcService } from './rpc/NodeRpcService';
import { Session } from '../models/Session';
import {
  DelegateTransactionUnsigned,
  NFTDenomIssueUnsigned,
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
import { AssetCreationType, AssetMarketPrice, UserAsset, UserAssetType } from '../models/UserAsset';
import { croMarketPriceApi } from './rpc/MarketApi';
import {
  BroadCastResult,
  NftAccountTransactionData,
  NftDenomModel,
  NftModel,
  NftQueryParams,
  NftTransferModel,
  ProposalModel,
  ProposalStatuses,
  RewardsBalances,
  RewardTransaction,
  RewardTransactionList,
  StakingTransactionData,
  StakingTransactionList,
  TransactionStatus,
  TransferTransactionData,
  TransferTransactionList,
  UnbondingDelegationData,
  UnbondingDelegationList,
  ValidatorModel,
} from '../models/Transaction';
import { ChainIndexingAPI } from './rpc/ChainIndexingAPI';
import { getBaseScaledAmount } from '../utils/NumberUtils';
import { createLedgerDevice, LEDGER_WALLET_TYPE } from './LedgerService';
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
import { capitalizeFirstLetter, sleep } from '../utils/utils';
import { WalletBuiltResult, WalletOps } from './WalletOps';
import { CronosClient } from './cronos/CronosClient';
import { evmTransactionSigner } from './signers/EvmTransactionSigner';
import { STATIC_ASSET_COUNT } from '../config/StaticAssets';
import { bridgeService } from './bridge/BridgeService';
import { WalletBaseService } from './WalletBaseService';

class WalletService extends WalletBaseService {
  public readonly BROADCAST_TIMEOUT_CODE = -32603;

  public async sendBridgeTransaction(bridgeTransferRequest: BridgeTransferRequest) {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const bridgeTransactionResult = await bridgeService.handleBridgeTransaction(
      bridgeTransferRequest,
    );

    await Promise.all([
      await this.fetchAndUpdateBalances(currentSession),
      await this.fetchAndSaveTransfers(currentSession),
    ]);

    return bridgeTransactionResult;
  }

  public async sendTransfer(transferRequest: TransferRequest): Promise<BroadCastResult> {
    // eslint-disable-next-line no-console
    console.log('TRANSFER_ASSET', transferRequest.asset);

    const currentAsset = transferRequest.asset;
    const scaledBaseAmount = getBaseScaledAmount(transferRequest.amount, currentAsset);

    const currentSession = await this.storageService.retrieveCurrentSession();
    const fromAddress = currentSession.wallet.address;
    const walletAddressIndex = currentSession.wallet.addressIndex;

    switch (currentAsset.assetType) {
      case UserAssetType.EVM:
        try {
          if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
            throw TypeError(`Missing asset config: ${currentAsset.config}`);
          }

          const cronosClient = new CronosClient(
            currentAsset.config?.nodeUrl,
            currentAsset.config?.indexingUrl,
          );

          const transfer: TransferTransactionUnsigned = {
            fromAddress,
            toAddress: transferRequest.toAddress,
            amount: String(scaledBaseAmount),
            memo: transferRequest.memo,
            accountNumber: 0,
            accountSequence: 0,
            asset: currentAsset,
          };

          const web3 = new Web3('');
          const txConfig: TransactionConfig = {
            from: currentAsset.address,
            to: transferRequest.toAddress,
            value: web3.utils.toWei(transferRequest.amount, 'ether'),
          };

          const prepareTxInfo = await this.prepareEVMTransaction(currentAsset, txConfig);

          transfer.nonce = prepareTxInfo.nonce;
          transfer.gasPrice = prepareTxInfo.loadedGasPrice;
          transfer.gasLimit = prepareTxInfo.gasLimit;

          let signedTx = '';
          if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
            const device = createLedgerDevice();

            const gasLimitTx = web3.utils.toBN(transfer.gasLimit!);
            const gasPriceTx = web3.utils.toBN(transfer.gasPrice);

            signedTx = await device.signEthTx(
              walletAddressIndex,
              Number(transfer.asset?.config?.chainId), // chainid
              transfer.nonce,
              web3.utils.toHex(gasLimitTx) /* gas limit */,
              web3.utils.toHex(gasPriceTx) /* gas price */,
              transfer.toAddress,
              web3.utils.toHex(transfer.amount),
              `0x${Buffer.from(transfer.memo).toString('hex')}`,
            );
          } else {
            signedTx = await evmTransactionSigner.signTransfer(
              transfer,
              transferRequest.decryptedPhrase,
            );
          }

          // eslint-disable-next-line no-console
          console.log(`${currentAsset.assetType} SIGNED-TX`, signedTx);
          const result = await cronosClient.broadcastRawTransactionHex(signedTx);

          // eslint-disable-next-line no-console
          console.log('BROADCAST_RESULT', result);

          return {
            transactionHash: result,
            message: '',
            code: 200,
          };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(`ERROR_TRANSFERRING - ${currentAsset.assetType}`, e);
          throw TypeError(e);
        }

      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC:
      case undefined: {
        const {
          nodeRpc,
          accountNumber,
          accountSequence,
          transactionSigner,
          ledgerTransactionSigner,
        } = await this.prepareTransaction();

        const transfer: TransferTransactionUnsigned = {
          fromAddress,
          toAddress: transferRequest.toAddress,
          amount: String(scaledBaseAmount),
          memo: transferRequest.memo,
          accountNumber,
          accountSequence,
          asset: currentAsset,
        };

        let signedTxHex: string = '';

        if (transferRequest.walletType === LEDGER_WALLET_TYPE) {
          signedTxHex = await ledgerTransactionSigner.signTransfer(
            transfer,
            transferRequest.decryptedPhrase,
          );
        } else {
          signedTxHex = await transactionSigner.signTransfer(
            transfer,
            transferRequest.decryptedPhrase,
          );
        }

        const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

        await Promise.all([
          await this.fetchAndUpdateBalances(currentSession),
          await this.fetchAndSaveTransfers(currentSession),
        ]);

        return broadCastResult;
      }

      default:
        return {};
    }
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
      await this.fetchAndSaveUnbondingDelegations(nodeRpc, currentSession),
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

  public async broadcastNFTDenomIssueTx(
    nftDenomIssueRequest: NFTDenomIssueRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.prepareTransaction();

    const memo = !nftDenomIssueRequest.memo ? DEFAULT_CLIENT_MEMO : nftDenomIssueRequest.memo;

    const nftDenomIssueUnsigned: NFTDenomIssueUnsigned = {
      ...nftDenomIssueRequest,
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';

    if (nftDenomIssueRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signNFTDenomIssue(
        nftDenomIssueUnsigned,
        nftDenomIssueRequest.decryptedPhrase,
      );
    } else {
      signedTxHex = await transactionSigner.signNFTDenomIssue(
        nftDenomIssueUnsigned,
        nftDenomIssueRequest.decryptedPhrase,
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
      this.fetchIBCAssets(currentSession),
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
      memo: DEFAULT_CLIENT_MEMO,
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
        switch (asset.assetType) {
          case UserAssetType.EVM:
            if (!asset.config || !asset.address) {
              // eslint-disable-next-line no-console
              console.log('NO_ASSET_CONFIG_0R_ADDRESS_FOUND', {
                config: asset.config,
                address: asset.address,
              });
              asset.balance = '0';
              await this.storageService.saveAsset(asset);
              return;
            }
            try {
              const cronosClient = new CronosClient(
                asset.config?.nodeUrl,
                asset.config?.indexingUrl,
              );

              asset.balance = await cronosClient.getNativeBalanceByAddress(asset.address);
              // eslint-disable-next-line no-console
              console.log(`${asset.assetType} Loaded balance: ${asset.balance} - ${asset.address}`);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.log(`BALANCE_FETCH_ERROR - ${asset.assetType}`, { asset, e });
            } finally {
              await this.storageService.saveAsset(asset);
            }
            break;

          case UserAssetType.TENDERMINT:
          case UserAssetType.IBC:
          case undefined:
            // Handle case for legacy assets that got persisted without a assetType - undefined
            try {
              const baseDenomination =
                asset.assetType !== UserAssetType.IBC
                  ? currentSession.wallet.config.network.coin.baseDenom
                  : `ibc/${asset.ibcDenomHash}`;
              asset.balance = await nodeRpc.loadAccountBalance(
                // Handling legacy wallets which had wallet.address
                asset.address || currentSession.wallet.address,
                baseDenomination,
              );
              asset.stakedBalance = await nodeRpc.loadStakingBalance(
                // Handling legacy wallets which had wallet.address
                asset.address || currentSession.wallet.address,
                baseDenomination,
              );
              asset.unbondingBalance = await nodeRpc.loadUnbondingBalance(
                // Handling legacy wallets which had wallet.address
                asset.address || currentSession.wallet.address,
              );
              asset.rewardsBalance = await nodeRpc.loadStakingRewardsBalance(
                // Handling legacy wallets which had wallet.address
                asset.address || currentSession.wallet.address,
                baseDenomination,
              );
              // eslint-disable-next-line no-console
              console.log(
                `${asset.symbol}: Loaded balances: ${asset.balance} - Staking: ${asset.stakedBalance} - Unbonding: ${asset.unbondingBalance} - Rewards: ${asset.rewardsBalance} - ${asset.address}`,
              );
            } catch (e) {
              // eslint-disable-next-line no-console
              console.log('BALANCE_FETCH_ERROR', { asset, e });
            } finally {
              await this.storageService.saveAsset(asset);
            }

            break;

          default:
            throw TypeError(`Unknown Asset type: ${asset}`);
        }
      }),
    );
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

  public async fetchAndUpdateTransactions(session: Session | null = null) {
    const currentSession: Session =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }

    const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);

    await Promise.all([
      this.fetchAndSaveDelegations(nodeRpc, currentSession),
      this.fetchAndSaveUnbondingDelegations(nodeRpc, currentSession),
      this.fetchAndSaveRewards(nodeRpc, currentSession),
      this.fetchAndSaveTransfers(currentSession),
      this.fetchAndSaveValidators(currentSession),
      this.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
  }

  public async fetchAndSaveTransfers(currentSession: Session) {
    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets(currentSession);

    await Promise.all(
      assets.map(async currentAsset => {
        const indexingUrl =
          currentAsset?.config?.indexingUrl || currentSession.wallet.config.indexingUrl;

        switch (currentAsset.assetType) {
          case UserAssetType.TENDERMINT:
          case UserAssetType.IBC:
          case undefined:
            try {
              const chainIndexAPI = ChainIndexingAPI.init(indexingUrl);
              const transferTransactions = await chainIndexAPI.fetchAllTransferTransactions(
                currentSession.wallet.config.network.coin.baseDenom,
                currentAsset?.address || currentSession.wallet.address,
                currentAsset,
              );

              await this.saveTransfers({
                transactions: transferTransactions,
                walletId: currentSession.wallet.identifier,
                assetId: currentAsset.identifier,
              });
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error('FAILED_TO_LOAD_TRANSFERS', e);
            }

            break;
          case UserAssetType.EVM:
            try {
              if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
                return;
              }

              const cronosClient = new CronosClient(
                currentAsset.config?.nodeUrl,
                currentAsset.config?.indexingUrl,
              );

              const transactions = await cronosClient.getTxsByAddress(currentAsset.address);
              const loadedTransactions = transactions.result.map(evmTx => {
                const transactionTime = new Date(Number(evmTx.timeStamp) * 1000).toISOString();

                const transferTx: TransferTransactionData = {
                  amount: evmTx.value,
                  assetSymbol: currentAsset.symbol,
                  date: transactionTime,
                  hash: evmTx.hash,
                  memo: '',
                  receiverAddress: evmTx.to,
                  senderAddress: evmTx.from,
                  status:
                    evmTx.isError === '1' ? TransactionStatus.FAILED : TransactionStatus.SUCCESS,
                };

                return transferTx;
              });

              // eslint-disable-next-line no-console
              console.log('Loaded transactions', transactions, loadedTransactions);

              await this.saveTransfers({
                transactions: loadedTransactions,
                walletId: currentSession.wallet.identifier,
                assetId: currentAsset?.identifier,
              });
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(`FAILED_TO_LOAD_TRANSFERS - ${currentAsset.assetType}`, e);
            }

            break;
          default:
            break;
        }
      }),
    );
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
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);

      const rewards = await nodeRpc.fetchStakingRewardsBalance(
        currentSession.wallet.address,
        currentSession.wallet.config.network.coin.baseDenom,
      );

      const claimedRewardsBalance = await chainIndexAPI.getTotalRewardsClaimedByAddress(
        // Handling legacy wallets which had wallet.address
        currentSession.wallet.address,
      );

      const delegatedValidatorList = rewards.transactions.map(tx => {
        return tx.validatorAddress;
      });

      const estimatedInfo = await chainIndexAPI.getFutureEstimatedRewardsByValidatorAddressList(
        delegatedValidatorList,
        SECONDS_OF_YEAR,
        currentSession.wallet.address,
      );

      await this.saveRewards({
        totalBalance: rewards.totalBalance,
        transactions: rewards.transactions,
        claimedRewardsBalance,
        estimatedRewardsBalance: estimatedInfo.estimatedRewards,
        estimatedApy: estimatedInfo.estimatedApy,
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

  public async fetchAndSaveUnbondingDelegations(nodeRpc: NodeRpcService, currentSession: Session) {
    try {
      const unbondingDelegations = await nodeRpc.fetchUnbondingDelegationBalance(
        currentSession.wallet.address,
      );
      await this.saveUnbondingDelegationsList({
        totalBalance: unbondingDelegations.totalBalance,
        delegations: unbondingDelegations.unbondingDelegations,
        walletId: currentSession.wallet.identifier,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_TO_LOAD_UNBONDING_DELEGATIONS', e);
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

    const userAssets = assets
      .filter(asset => asset.assetType !== UserAssetType.IBC)
      .map(data => {
        const asset: UserAsset = { ...data };
        return asset;
      });

    // https://github.com/louischatriot/nedb/issues/185
    // NeDB does not support distinct queries, it needs to be done programmatically
    return _.uniqBy(userAssets, 'symbol');
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

  public async retrieveAllAssetsPrices(currency: string): Promise<AssetMarketPrice[]> {
    const assetsPrices = [];
    const prices = await this.storageService.retrieveAllAssetsPrices(currency);
    prices.forEach(data => {
      // eslint-disable-next-line no-underscore-dangle
      assetsPrices[data._id] = {
        price: data.price,
        currency: data.currency,
        assetSymbol: data.assetSymbol,
        dailyChange: data.dailyChange,
      };
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

  public async handleCurrentWalletAssetsMigration(phrase: string, session?: Session) {
    // 1. Check if current wallet has all expected static assets
    // 2. If static assets are missing, remove all existing non dynamic assets
    // 3. Prompt user password and re-create static assets on the fly
    // 3. Run sync all to synchronize all assets states

    const currentSession = session || (await this.storageService.retrieveCurrentSession());
    const { wallet } = currentSession;

    if (await this.checkIfWalletNeedAssetCreation(currentSession)) {
      await this.storageService.removeWalletAssets(wallet.identifier);

      const walletOps = new WalletOps();
      const assetGeneration = walletOps.generate(wallet.config, wallet.identifier, phrase);

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
