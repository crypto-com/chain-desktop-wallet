import Big from 'big.js';
import { StorageService } from '../storage/StorageService';
import { NodeRpcService } from './rpc/NodeRpcService';
import {
  NOT_KNOWN_YET_VALUE,
  SECONDS_OF_YEAR,
  VALIDATOR_UPTIME_THRESHOLD,
} from '../config/StaticConfig';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { CronosClient } from './cronos/CronosClient';
import {
  CommonTransactionRecord,
  NftModel,
  NftQueryParams,
  NftTransferModel,
  ProposalModel,
  ProposalStatuses,
  RewardTransactionList,
  StakingTransactionList,
  TransactionStatus,
  TransferTransactionData,
  TransferTransactionList,
  TransferTransactionRecord,
  UnbondingDelegationList,
  ValidatorModel,
} from '../models/Transaction';
import { Session } from '../models/Session';
import { ChainIndexingAPI } from './rpc/ChainIndexingAPI';
import { croMarketPriceApi } from './rpc/MarketApi';
import { isCRC20AssetWhitelisted } from '../utils/utils';
import { SupportedCRCTokenStandard } from './rpc/interface/cronos.chainIndex';

export class TransactionHistoryService {
  private storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
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
      // this.fetchAndSaveTransfers(currentSession),
      this.fetchAndSaveValidators(currentSession),
      this.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
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

  private async getLatestTopValidators(): Promise<ValidatorModel[]> {
    try {
      const currentSession = await this.storageService.retrieveCurrentSession();
      if (currentSession?.wallet.config.nodeUrl === NOT_KNOWN_YET_VALUE) {
        return Promise.resolve([]);
      }
      const nodeRpc = await NodeRpcService.init(currentSession.wallet.config.nodeUrl);
      const topValidators = await nodeRpc.loadTopValidators();
      const topValidatorsAddressList = topValidators.map(validator => {
        return validator.validatorAddress;
      });
      const chainIndexAPI = ChainIndexingAPI.init(currentSession.wallet.config.indexingUrl);
      const validatorList = await chainIndexAPI.getValidatorsDetail(topValidatorsAddressList);

      const topValidatorsInfo = topValidators
        .map(validator => {
          const matchValidator = validatorList.find(val => {
            return val.operatorAddress === validator.validatorAddress;
          });

          return {
            ...validator,
            apy: matchValidator?.apy,
            uptime: matchValidator?.impreciseUpTime,
          };
        })
        // Group validators by uptime >= 99.9% & uptime < 99.9%
        // For Group uptime < 99.9%, sort by Highest uptime %
        .sort((v1, v2) => {
          const v1Uptime = Big(v1.uptime ?? '0');
          const v2Uptime = Big(v2.uptime ?? '0');
          if (
            v1Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) >= 0 &&
            v2Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) < 0
          ) {
            return -1;
          }
          if (
            v1Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) < 0 &&
            v2Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) >= 0
          ) {
            return 1;
          }
          if (
            v1Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) < 0 &&
            v2Uptime.cmp(VALIDATOR_UPTIME_THRESHOLD) < 0
          ) {
            return v2Uptime.cmp(v1Uptime);
          }
          return 0;
        });
      return topValidatorsInfo;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING TOP VALIDATORS', e);
      return [];
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

  public async saveUnbondingDelegationsList(unbondingDelegations: UnbondingDelegationList) {
    return this.storageService.saveUnbondingDelegations(unbondingDelegations);
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

  public async saveRewards(rewardTransactions: RewardTransactionList) {
    return this.storageService.saveRewardList(rewardTransactions);
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

  public async saveDelegationsList(stakingTransactions: StakingTransactionList) {
    return this.storageService.saveStakingTransactions(stakingTransactions);
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

              this.saveTransfers({
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

              this.saveTransfers({
                transactions: loadedTransactions,
                walletId: currentSession.wallet.identifier,
                assetId: currentAsset?.identifier,
              });
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(`FAILED_TO_LOAD_TRANSFERS - ${currentAsset.assetType}`, e);
            }

            break;
          case UserAssetType.CRC_20_TOKEN:
            {
              if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
                return;
              }

              const cronosClient = new CronosClient(
                currentAsset.config?.nodeUrl,
                currentAsset.config?.indexingUrl,
              );

              const transactionsResponse = await cronosClient.getTokenTransfersByAddress(
                currentAsset.address,
                { contractaddress: currentAsset.contractAddress },
              );
              const loadedTransactions = transactionsResponse.result.map(crc20TokenTx => {
                const transactionTime = new Date(
                  Number(crc20TokenTx.timeStamp) * 1000,
                ).toISOString();

                const transferTx: TransferTransactionData = {
                  amount: crc20TokenTx.value,
                  assetSymbol: currentAsset.symbol,
                  date: transactionTime,
                  hash: crc20TokenTx.hash,
                  memo: '',
                  receiverAddress: crc20TokenTx.to,
                  senderAddress: crc20TokenTx.from,
                  status: TransactionStatus.SUCCESS,
                };

                return transferTx;
              });

              // eslint-disable-next-line no-console
              console.log(`LOADED_TXS ${currentAsset.symbol}: `, loadedTransactions);

              this.saveTransfers({
                transactions: loadedTransactions,
                walletId: currentSession.wallet.identifier,
                assetId: currentAsset?.identifier,
              });
            }
            break;

          default:
            break;
        }
      }),
    );
  }

  // eslint-disable-next-line class-methods-use-this
  public async fetchAndSaveTransfersByAsset(
    currentSession: Session,
    currentAsset: UserAsset,
  ): Promise<CommonTransactionRecord[]> {
    const indexingUrl =
      currentAsset?.config?.indexingUrl || currentSession.wallet.config.indexingUrl;

    const defaultTxType = 'transfer';

    switch (currentAsset.assetType) {
      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC:
      case undefined:
        try {
          const chainIndexAPI = ChainIndexingAPI.init(indexingUrl);
          const transferTransactions = await chainIndexAPI.fetchAssetDetailTransactions(
            currentSession.wallet.identifier,
            currentSession.wallet.config.network.coin.baseDenom,
            currentAsset?.address || currentSession.wallet.address,
            currentAsset,
          );
          return transferTransactions;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('FAILED_TO_LOAD_TRANSFERS', e);
        }

        break;
      case UserAssetType.EVM:
        try {
          if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
            return [];
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
              status: evmTx.isError === '1' ? TransactionStatus.FAILED : TransactionStatus.SUCCESS,
            };

            const transferTxRecord: TransferTransactionRecord = {
              walletId: currentSession.wallet.identifier,
              assetId: currentAsset.identifier,
              assetType: currentAsset.assetType,
              txHash: evmTx.hash,
              txType: defaultTxType,
              txData: transferTx,
              // TODO: add messageTypeName
              // messageTypeName: 'transfer',
            };

            return transferTxRecord;
          });

          // eslint-disable-next-line no-console
          console.log('Loaded transactions', transactions, loadedTransactions);

          return loadedTransactions;
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(`FAILED_TO_LOAD_TRANSFERS - ${currentAsset.assetType}`, e);
        }

        break;
      case UserAssetType.CRC_20_TOKEN:
        {
          if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
            return [];
          }

          const cronosClient = new CronosClient(
            currentAsset.config?.nodeUrl,
            currentAsset.config?.indexingUrl,
          );

          const transactionsResponse = await cronosClient.getTokenTransfersByAddress(
            currentAsset.address,
            { contractaddress: currentAsset.contractAddress },
          );
          const loadedTransactions = transactionsResponse.result.map(crc20TokenTx => {
            const transactionTime = new Date(Number(crc20TokenTx.timeStamp) * 1000).toISOString();

            const transferTx: TransferTransactionData = {
              amount: crc20TokenTx.value,
              assetSymbol: currentAsset.symbol,
              date: transactionTime,
              hash: crc20TokenTx.hash,
              memo: '',
              receiverAddress: crc20TokenTx.to,
              senderAddress: crc20TokenTx.from,
              status: TransactionStatus.SUCCESS,
            };

            const transferTxRecord: TransferTransactionRecord = {
              walletId: currentSession.wallet.identifier,
              assetId: currentAsset.identifier,
              assetType: currentAsset.assetType,
              txHash: crc20TokenTx.hash,
              txType: defaultTxType,
              txData: transferTx,
              // TODO: add messageTypeName
              // messageTypeName: 'transfer',
            };

            return transferTxRecord;
          });

          // eslint-disable-next-line no-console
          console.log(`LOADED_TXS ${currentAsset.symbol}: `, loadedTransactions);

          return loadedTransactions;
        }
        break;

      default:
        break;
    }

    return [];
  }

  public async saveTransfers(transferTransactions: TransferTransactionList) {
    return this.storageService.saveTransferTransactions(transferTransactions);
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

  // Todo: Is this supposed to be called from somewhere?
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

  private async fetchCurrentWalletCRC20Tokens(croEvmAsset: UserAsset, session: Session) {
    const { address } = croEvmAsset;

    if (!address || !croEvmAsset.config?.nodeUrl) {
      return [];
    }

    const cronosClient = new CronosClient(
      croEvmAsset.config?.nodeUrl,
      croEvmAsset.config?.indexingUrl,
    );

    const tokensListResponse = await cronosClient.getTokensOwnedByAddress(address);

    const newlyLoadedTokens = await tokensListResponse.result
      .filter(token => token.type === SupportedCRCTokenStandard.CRC_20_TOKEN)
      .map(async token => {
        const newCRC20Token: UserAsset = {
          balance: token.balance,
          decimals: Number(token.decimals),
          contractAddress: token.contractAddress,
          description: `${token.name} (${token.symbol})`,
          icon_url: CronosClient.getTokenIconUrlBySymbol(token.symbol),
          identifier: `${token.name}_(${token.symbol})_${croEvmAsset.walletId}`,
          mainnetSymbol: token.symbol,
          name: croEvmAsset.name,
          rewardsBalance: '',
          stakedBalance: '',
          symbol: token.symbol,
          unbondingBalance: '',
          walletId: croEvmAsset.walletId,
          isSecondaryAsset: true,
          assetType: UserAssetType.CRC_20_TOKEN,
          address: croEvmAsset.address,
          config: croEvmAsset.config,
          isWhitelisted: isCRC20AssetWhitelisted(
            token.symbol,
            token.contractAddress,
            session.wallet.config,
          ),
        };

        // eslint-disable-next-line no-console
        console.log(`CRC_20_PERSISTED_TOKEN ${token.symbol}:`, {
          address,
          balance: token.balance,
        });

        await this.storageService.saveAsset(newCRC20Token);
        return newCRC20Token;
      });

    // eslint-disable-next-line no-console
    console.log('CRC_20_PERSISTED_TOKENS', {
      address,
      size: newlyLoadedTokens.length,
      newlyLoadedTokens,
    });

    return newlyLoadedTokens;
  }

  public async fetchTokensAndPersistBalances(session: Session | null = null) {
    const currentSession =
      session == null ? await this.storageService.retrieveCurrentSession() : session;
    if (!currentSession) {
      return;
    }
    const assets: UserAsset[] = await this.retrieveCurrentWalletAssets(currentSession);

    if (!assets || assets.length === 0) {
      return;
    }

    // Remove existing CRC20 tokens & refetch balances for all assets
    const CRC20TokenList = assets.filter(asset => asset.assetType === UserAssetType.CRC_20_TOKEN);
    await this.storageService.removeAssets(CRC20TokenList);

    await Promise.all(
      assets.map(async asset => {
        switch (asset.assetType) {
          case UserAssetType.TENDERMINT:
            break;
          case UserAssetType.EVM:
            await this.fetchCurrentWalletCRC20Tokens(asset, currentSession);
            break;
          default:
            break;
        }
      }),
    );
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

    // Fetch and update tokens balances
    try {
      await this.fetchTokensAndPersistBalances(session);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Error while trying to fetch tokens balances', e);
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
              console.log(
                `${asset.name} ${asset.assetType} Loaded balance: ${asset.balance} - ${asset.address}`,
              );
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
            break;
        }
      }),
    );
  }
}
