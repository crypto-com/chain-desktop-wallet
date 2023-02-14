import axios, { AxiosInstance } from 'axios';
import Big from 'big.js';
import { isArray } from 'lodash';
import {
  NftAccountTransactionListResponse,
  NftDenomResponse,
  NftListResponse,
  CryptoOrgNftResponse,
  NftTransactionListResponse,
  NftTransactionResponse,
  TransferDataAmount,
  TransferListResponse,
  TransferResult,
  AccountMessageListResponse,
  AccountMessage,
  ValidatorListResponse,
  AccountInfoResponse,
  ValidatorResponse,
} from './ChainIndexingModels';
import {
  NftQueryParams,
  TransactionStatus,
  TransferTransactionData,
  MsgTypeName,
  TransactionData,
  BaseCommonTransaction,
  TransferTransactionRecord,
  StakingTransactionRecord,
  RewardTransactionRecord,
  CommonTransactionRecord,
} from '../../models/Transaction';
import { CryptoOrgNftModelData } from '../../models/Nft';
import { DefaultWalletConfigs, SECONDS_OF_YEAR } from '../../config/StaticConfig';
import { croNftApi, MintByCDCRequest } from './NftApi';
import { splitToChunks } from '../../utils/utils';
import { UserAsset } from '../../models/UserAsset';

export interface IChainIndexingAPI {
  fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
  ): Promise<Array<TransferTransactionData>>;
}

export class ChainIndexingAPI implements IChainIndexingAPI {
  private readonly axiosClient: AxiosInstance;

  private constructor(axiosClient: AxiosInstance) {
    this.axiosClient = axiosClient;
  }

  public static init(baseUrl: string) {
    const defaultIndexingUrl = DefaultWalletConfigs.TestNetConfig.indexingUrl;
    const chainIndexBaseUrl = !baseUrl ? defaultIndexingUrl : baseUrl;
    const axiosClient = axios.create({
      baseURL: chainIndexBaseUrl,
    });
    return new ChainIndexingAPI(axiosClient);
  }

  public async getAccountNFTList(account: string): Promise<CryptoOrgNftResponse[]> {
    let paginationPage = 1;
    const nftsListRequest = await this.axiosClient.get<NftListResponse>(
      `/nfts/accounts/${account}/tokens?page=${paginationPage}`,
    );
    const nftsListResponse: NftListResponse = nftsListRequest.data;

    let { pagination } = nftsListResponse;

    const nftLists = nftsListResponse.result;

    while (pagination.total_page > pagination.current_page) {
      paginationPage += 1;
      // eslint-disable-next-line no-await-in-loop
      const pageNftsListRequest = await this.axiosClient.get<NftListResponse>(
        `/nfts/accounts/${account}/tokens?page=${paginationPage}`,
      );
      const pageNftsListResponse: NftListResponse = pageNftsListRequest.data;

      pagination = pageNftsListResponse.pagination;
      nftLists.push(...pageNftsListResponse.result);
    }

    return nftLists;
  }

  // eslint-disable-next-line class-methods-use-this
  public async getNftListMarketplaceData(
    nftLists: CryptoOrgNftResponse[],
  ): Promise<CryptoOrgNftModelData[]> {
    const nftListMap: CryptoOrgNftModelData[] = [];
    const payload: MintByCDCRequest[] = nftLists.map(item => {
      nftListMap[`${item.denomId}-${item.tokenId}`] = {
        ...item,
        isMintedByCDC: false,
        marketplaceLink: '',
      };
      return {
        denomId: item.denomId,
        tokenIds: [item.tokenId],
      };
    });

    const payloadChunks = splitToChunks(payload, 10);

    try {
      const results = await Promise.all(
        payloadChunks.map(async chunks => {
          return await croNftApi.getNftListMarketplaceData(chunks);
        }),
      );

      results.forEach(result => {
        result.forEach(item => {
          nftListMap[`${item.denomId}-${item.tokenId}`] = {
            ...nftListMap[`${item.denomId}-${item.tokenId}`],
            isMintedByCDC: item.isMinted,
            marketplaceLink: item.link ? item.link : '',
          };
        });
      });
      return Object.values(nftListMap);
    } catch (e) {
      return Object.values(nftListMap);
    }
  }

  public async getNFTTransferHistory(nftQuery: NftQueryParams): Promise<NftTransactionResponse[]> {
    let paginationPage = 1;
    const { denomId, tokenId } = nftQuery;
    const nftsTxListRequest = await this.axiosClient.get<NftTransactionListResponse>(
      `/nfts/denoms/${denomId}/tokens/${tokenId}/transfers`,
    );

    const nftTxListResponse: NftTransactionListResponse = nftsTxListRequest.data;
    let { pagination } = nftTxListResponse;

    const nftTxLists = nftTxListResponse.result;

    while (pagination.total_page > pagination.current_page) {
      paginationPage += 1;
      // eslint-disable-next-line no-await-in-loop
      const pageNftTxListRequest = await this.axiosClient.get<NftTransactionListResponse>(
        `/nfts/denoms/${denomId}/tokens/${tokenId}/transfers?page=${paginationPage}`,
      );
      const pageNftTxListResponse: NftTransactionListResponse = pageNftTxListRequest.data;
      pagination = pageNftTxListResponse.pagination;

      nftTxLists.push(...pageNftTxListResponse.result);
    }

    return nftTxLists;
  }

  public async fetchAllTransferTransactions(
    baseAssetSymbol: string,
    address: string,
    asset?: UserAsset,
  ): Promise<Array<TransferTransactionData>> {
    const msgType: MsgTypeName[] = [
      MsgTypeName.MsgSend,
      MsgTypeName.MsgWithdrawDelegatorReward,
      MsgTypeName.MsgDelegate,
      MsgTypeName.MsgUndelegate,
    ];

    const transferListResponse = await this.axiosClient.get<TransferListResponse>(
      `/accounts/${address}/messages?order=height.desc&filter.msgType=${msgType.join(
        ',',
      )}&limit=1000`,
    );

    function getStatus(transfer: TransferResult) {
      if (transfer.success) {
        return TransactionStatus.SUCCESS;
      }
      return TransactionStatus.FAILED;
    }

    const { data } = transferListResponse;

    function getTransferAmount(transfer): TransferDataAmount | null {
      if (transfer.data.hasOwnProperty('amount')) {
        if (isArray(transfer.data.amount)) {
          return transfer.data.amount.filter(amount => amount?.denom === baseAssetSymbol)[0];
        }
        if (transfer.data.amount?.denom === baseAssetSymbol) {
          return transfer.data.amount;
        }
      }
      return null;
    }

    try {
      return data.result
        .filter(trx => {
          const transferAmount = getTransferAmount(trx);
          return transferAmount !== undefined && transferAmount !== null;
        })
        .map(transfer => {
          const assetAmount = getTransferAmount(transfer);
          const transferData: TransferTransactionData = {
            amount: assetAmount?.amount ?? '0',
            assetSymbol: asset?.symbol || baseAssetSymbol,
            date: transfer.blockTime,
            hash: transfer.transactionHash,
            memo: '',
            receiverAddress: transfer.data.toAddress,
            senderAddress: transfer.data.fromAddress,
            status: getStatus(transfer),
          };
          return transferData;
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_TRANSFERS', { data, baseAssetSymbol, address });
      return [];
    }
  }

  public async fetchAssetDetailTransactions(
    walletId: string,
    baseAssetSymbol: string,
    address: string,
    asset: UserAsset,
  ): Promise<CommonTransactionRecord[]> {
    const msgType: MsgTypeName[] = [
      MsgTypeName.MsgSend,
      MsgTypeName.MsgWithdrawDelegatorReward,
      MsgTypeName.MsgDelegate,
      MsgTypeName.MsgUndelegate,
    ];

    const transactionListResponse = await this.getMessagesByAccountAddress(address, msgType);

    function getStatus(transfer: AccountMessage) {
      if (transfer.success) {
        return TransactionStatus.SUCCESS;
      }
      return TransactionStatus.FAILED;
    }

    function getTransactionAmount(tx): TransferDataAmount | null {
      if (tx.data.hasOwnProperty('amount')) {
        if (isArray(tx.data.amount)) {
          return tx.data.amount.filter(amount => amount?.denom === baseAssetSymbol)[0];
        }
        if (tx.data.amount?.denom === baseAssetSymbol) {
          return tx.data.amount;
        }
      }
      return null;
    }

    function getAutoClaimedRewardsAmount(tx): TransferDataAmount | null {
      if (tx.data.hasOwnProperty('autoClaimedRewards')) {
        if (isArray(tx.data.autoClaimedRewards)) {
          return tx.data.autoClaimedRewards.filter(amount => amount?.denom === baseAssetSymbol)[0];
        }
        if (tx.data.autoClaimedRewards?.denom === baseAssetSymbol) {
          return tx.data.autoClaimedRewards;
        }
      }
      return null;
    }

    try {
      return transactionListResponse
        .filter(tx => {
          const transferAmount = getTransactionAmount(tx);
          return (
            transferAmount !== undefined &&
            transferAmount !== null &&
            msgType.includes(tx.data.msgName)
          );
        })
        .map(tx => {
          const assetAmount = getTransactionAmount(tx);
          const autoClaimedRewardsAmount = getAutoClaimedRewardsAmount(tx);

          const commonTransaction: BaseCommonTransaction = {
            walletId,
            assetId: asset.identifier,
            assetType: asset.assetType,
            txHash: tx.transactionHash,
          };

          const transactionData: TransactionData = {
            assetSymbol: asset?.symbol || baseAssetSymbol,
            date: tx.blockTime,
            hash: tx.transactionHash,
            memo: '',
            status: getStatus(tx),
          };

          if (tx.data.msgName === '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward') {
            const rewardTransactionRecord: RewardTransactionRecord = {
              ...commonTransaction,
              txType: 'reward',
              messageTypeName: tx.data.msgName,
              txData: {
                ...transactionData,
                receiverAddress: tx.data?.recipientAddress ?? '',
                delegatorAddress: tx.data?.delegatorAddress ?? '',
                validatorAddress: tx.data?.validatorAddress ?? '',
                amount: assetAmount?.amount ?? '0',
              },
            };
            return rewardTransactionRecord;
          }

          if (tx.data.msgName === '/cosmos.staking.v1beta1.MsgDelegate' || tx.data.msgName === '/cosmos.staking.v1beta1.MsgUndelegate') {
            const stakingTransactionRecord: StakingTransactionRecord = {
              ...commonTransaction,
              txType: 'staking',
              messageTypeName: tx.data.msgName,
              txData: {
                ...transactionData,
                delegatorAddress: tx.data?.delegatorAddress ?? '',
                validatorAddress: tx.data?.validatorAddress ?? '',
                stakedAmount: assetAmount?.amount ?? '0',
                autoClaimedRewards: autoClaimedRewardsAmount?.amount ?? '0',
              },
            };
            return stakingTransactionRecord;
          }

          const transferTransactionRecord: TransferTransactionRecord = {
            ...commonTransaction,
            txType: 'transfer',
            messageTypeName: tx.data.msgName,
            txData: {
              ...transactionData,
              receiverAddress: tx.data?.toAddress ?? '',
              senderAddress: tx.data?.fromAddress ?? '',
              amount: assetAmount?.amount ?? '0',
            },
          };
          return transferTransactionRecord;
        });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_TRANSACTIONS', {
        transactionListResponse,
        baseAssetSymbol,
        address,
      });
      return [];
    }
  }

  public async fetchAllAccountNFTsTransactions(
    address: string,
  ): Promise<NftAccountTransactionListResponse> {
    try {
      const msgType: MsgTypeName[] = [
        MsgTypeName.MsgTransferNFT,
        MsgTypeName.MsgBurnNFT,
        MsgTypeName.MsgIssueDenom,
        MsgTypeName.MsgEditNFT,
        MsgTypeName.MsgMintNFT
      ];
      const nftTxsListResponse = await this.axiosClient.get<NftAccountTransactionListResponse>(
        `accounts/${address}/messages?order=height.desc&filter.msgType=${msgType.join(
          ',',
        )}`,
      );
      return nftTxsListResponse.data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_NFT_ACCOUNT_TXs', e);
      return {
        result: [],
      };
    }
  }

  /**
   * Fetch all `MsgVote` transactions submitted on-chain by an account
   * @param address {string}
   */
  public async fetchAccountVotingHistory(address: string): Promise<AccountMessage[]> {
    try {
      const msgTypeNames: MsgTypeName[] = [MsgTypeName.MsgVote];

      const userVoteHistory = await this.getMessagesByAccountAddress(address, msgTypeNames);
      return userVoteHistory;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_LOADING_VOTE_HISTORY', e);
      return [];
    }
  }

  public async fetchNftDenomData(denomId: string): Promise<NftDenomResponse> {
    try {
      const denomIdInfo = await this.axiosClient.get<NftDenomResponse>(`nfts/denoms/${denomId}`);
      return denomIdInfo.data;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('FAILED_LOADING_NFT_DENOM_INFO', e);
      return {
        result: null,
      };
    }
  }

  /**
   * Gets estimated CRO rewards for a useraddress
   * @param userAddress 
   * @param validatorAddress 
   * @param futureDurationInSec
   @returns {string} Estimated rewards in baseunit 
  */
  public async getFutureEstimatedRewardsByValidatorAddressList(
    validatorAddressList: string[],
    durationInSeconds: number,
    userAddress: string,
  ) {
    const [validatorsAverageApy, bondedBalanceInString] = await Promise.all([
      this.getValidatorsAverageApy(validatorAddressList),
      this.getTotalBondedBalanceByUserAddress(userAddress),
    ]);

    if (!validatorsAverageApy) {
      throw new Error('Cannot fetch validator information.');
    }

    const apyRate = validatorsAverageApy; // already fetched as divided by 100

    const timeInYrs = new Big(durationInSeconds).div(new Big(SECONDS_OF_YEAR));

    /**
     Note: 
     - Commission rate is not deducted
     - Compound frequency not considered.
     - Considering APY as simple interest rate.
     - Current Formula: Final Balance = Principal * ((rate/100) * timeInYrs)
     */
    const estimatedRewards = new Big(bondedBalanceInString).mul(new Big(apyRate).mul(timeInYrs));
    return {
      estimatedRewards: estimatedRewards.toFixed(18),
      estimatedApy: apyRate,
    };
  }

  private async getTotalBondedBalanceByUserAddress(userAddress: string) {
    const accountInfo = await this.axiosClient.get<AccountInfoResponse>(`accounts/${userAddress}`);
    let totalBondedBalance = new Big(0);

    // Calculate total bonded balance
    accountInfo.data.result.bondedBalance.forEach(amount => {
      totalBondedBalance = totalBondedBalance.add(amount.amount);
    });

    // Total bonded balance
    return totalBondedBalance.toString();
  }

  private async getValidatorDetails(validatorAddr: string) {
    const validatorList = await this.axiosClient.get<ValidatorListResponse>(
      'validators?limit=1000000',
    );

    if (validatorList.data.pagination.total_page > 1) {
      throw new Error('Validator list is very big. Aborting.');
    }

    // Check if returned list is empty
    if (validatorList.data.result.length < 1) {
      return undefined;
    }

    const listedValidatorInfo = validatorList.data.result.find(
      validatorInfo => validatorInfo.operatorAddress === validatorAddr,
    );

    // Listed ValidatorInfo
    return listedValidatorInfo;
  }

  public async getValidatorsDetail(validatorAddrList: string[]) {
    const validatorList = await this.axiosClient.get<ValidatorListResponse>(
      'validators?limit=1000000',
    );

    if (validatorList.data.pagination.total_page > 1) {
      throw new Error('Validator list is very big. Aborting.');
    }

    // Check if returned list is empty
    if (validatorList.data.result.length < 1) {
      return [];
    }
    return validatorList.data.result.filter(validatorInfo =>
      validatorAddrList.includes(validatorInfo.operatorAddress),
    );
  }

  public async getValidatorsAverageApy(validatorAddrList: string[]) {
    const validatorList = await this.axiosClient.get<ValidatorListResponse>(
      'validators?limit=1000000',
    );

    if (validatorList.data.pagination.total_page > 1) {
      throw new Error('Validator list is very big. Aborting.');
    }

    // Check if returned list is empty
    if (validatorList.data.result.length < 1) {
      return undefined;
    }

    let apySum = new Big(0);
    const listedValidatorInfo = validatorList.data.result.filter(validatorInfo =>
      validatorAddrList.includes(validatorInfo.operatorAddress),
    );

    listedValidatorInfo.forEach(validatorInfo => {
      apySum = apySum.add(new Big(validatorInfo.apy));
    });

    // Listed ValidatorInfo
    return apySum.div(listedValidatorInfo.length || 1).toString();
  }

  // NOTE: getting validator by address doesn't have `apy` property
  public async getValidatorUptimeByAddress(validatorAddr: string) {
    const validatorInfo = await this.axiosClient.get<ValidatorResponse>(
      `validators/${validatorAddr}`,
    );

    if (!validatorInfo.data.result) {
      throw new Error('Validator details not found.');
    }

    if (validatorInfo.data.result && !validatorInfo.data.result.impreciseUpTime) {
      return '0';
    }

    return validatorInfo.data.result.impreciseUpTime;
  }

  /**
   * Get total rewards for an active account on CRO (Cosmos SDK) chain
   * @param address
   */
  public async getTotalRewardsClaimedByAddress(address: string) {
    try {
      const rewardMsgList = await this.getDelegatorRewardMessageList(address);
      let totalClaims = new Big(0);

      rewardMsgList.forEach(msg => {
        // Only process this MSG type
        if (msg.messageType === MsgTypeName.MsgWithdrawDelegatorReward) {
          // Check recipient and delegator
          if (msg.data.delegatorAddress === msg.data.recipientAddress) {
            // Process non-empty msg `amount` list
            msg.data.amount.forEach(amount => {
              totalClaims = totalClaims.add(new Big(amount.amount));
            });
          }
        }
      });

      // TotalRewardsClaimed in string
      return totalClaims.toString();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('FAILED_CALCULATING_TOTAL_REWARDS', e);
      return '0';
    }
  }

  private async getDelegatorRewardMessageList(address: string) {
    let currentPage = 1;
    let totalPages = 1;
    const finalMsgList: AccountMessage[] = [];

    while (currentPage <= totalPages) {
      // eslint-disable-next-line no-await-in-loop
      const delegatorRewardMessageList = await this.axiosClient.get<AccountMessageListResponse>(
        `accounts/${address}/messages?order=height.desc&filter.msgType=${MsgTypeName.MsgWithdrawDelegatorReward}&page=${currentPage}`,
      );

      totalPages = delegatorRewardMessageList.data.pagination.total_page;
      currentPage += 1;

      // Check if returned list is empty
      if (delegatorRewardMessageList.data.result.length < 1) {
        return finalMsgList;
      }

      // Process incoming list to sum total claimed rewards
      finalMsgList.push(...delegatorRewardMessageList.data.result);
    }

    return finalMsgList;
  }

  /**
   * TODO: Under construction
   * @param userAddress Supports only Crypto.org USER addresses
   * @param optionalMsgTypeNameList {Optional} Cosmos MsgType Name
   */
  public async getMessagesByAccountAddress(
    userAddress: string,
    optionalMsgTypeNameList?: MsgTypeName[],
  ) {
    let currentPage = 1;
    let totalPages = 1;

    const queryURL = `accounts/${userAddress}/messages`;

    const finalMsgList: AccountMessage[] = [];

    const mayBeMsgTypeList =
      optionalMsgTypeNameList && optionalMsgTypeNameList.length > 0
        ? optionalMsgTypeNameList.join(',')
        : undefined;

    const requestParams = {
      page: currentPage,
      order: 'height.desc',
      'filter.msgType': mayBeMsgTypeList,
    };

    while (currentPage <= totalPages) {
      // eslint-disable-next-line no-await-in-loop
      const messageList = await this.axiosClient.get<AccountMessageListResponse>(queryURL, {
        params: requestParams,
      });

      totalPages = messageList.data.pagination.total_page;
      currentPage += 1;
      requestParams.page = currentPage; // update current page

      // Check if returned list is empty
      if (messageList.data.result.length < 1) {
        return finalMsgList;
      }

      // Process incoming list to sum total claimed rewards
      finalMsgList.push(...messageList.data.result);
    }

    return finalMsgList;
  }
}
