import { toWei } from 'web3-utils';
import { Transaction } from 'web3-types';
import { ethers } from 'ethers';
import Big from 'big.js';
import {
  RestakeStakingRewardTransactionUnsigned,
  RestakeStakingAllRewardsTransactionUnsigned,
  DelegateTransactionUnsigned,
  TransferTransactionUnsigned,
  UndelegateTransactionUnsigned,
  RedelegateTransactionUnsigned,
  VoteTransactionUnsigned,
  NFTTransferUnsigned,
  WithdrawStakingRewardUnsigned,
  NFTDenomIssueUnsigned,
  NFTMintUnsigned,
  EVMContractCallUnsigned,
  WithdrawAllStakingRewardsUnsigned,
  MsgDepositTransactionUnsigned,
  TextProposalTransactionUnsigned,
} from './signers/TransactionSupported';
import { BroadCastResult } from '../models/Transaction';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { NftType } from '../models/Nft';
import { getBaseScaledAmount } from '../utils/NumberUtils';
import { DEFAULT_CLIENT_MEMO, SupportedChainName } from '../config/StaticConfig';
import {
  RestakeStakingRewardRequest,
  RestakeStakingAllRewardsRequest,
  TransferRequest,
  DelegationRequest,
  UndelegationRequest,
  RedelegationRequest,
  VoteRequest,
  NFTTransferRequest,
  WithdrawStakingRewardRequest,
  WithdrawAllStakingRewardRequest,
  BridgeTransferRequest,
  NFTDenomIssueRequest,
  NFTMintRequest,
  DepositToProposalRequest,
  TextProposalRequest,
} from './TransactionRequestModels';
import { StorageService } from './storage/StorageService';
import { CronosClient } from './cronos/CronosClient';
import { EVMClient } from './rpc/clients/EVMClient';
import { TransactionPrepareService } from './TransactionPrepareService';
import { EvmTransactionSigner, evmTransactionSigner } from './signers/EvmTransactionSigner';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from './LedgerService';
import { TransactionHistoryService } from './TransactionHistoryService';
import { checkIfTestnet, getCronosEvmAsset, sleep } from '../utils/utils';
import { BridgeService } from './bridge/BridgeService';
import { walletService } from './WalletService';
import { getCronosTendermintFeeConfig } from './Gas';
import { DerivationPathStandard } from './signers/LedgerSigner';
import { CronosMainnetChainConfig, CronosTestnetChainConfig } from '../config/DAppChainConfig';

export class TransactionSenderService {
  public readonly storageService: StorageService;

  public readonly transactionPrepareService: TransactionPrepareService;

  public readonly txHistoryManager: TransactionHistoryService;

  constructor(
    storageService: StorageService,
    transactionPrepareService: TransactionPrepareService,
    txHistoryManager: TransactionHistoryService,
  ) {
    this.storageService = storageService;
    this.transactionPrepareService = transactionPrepareService;
    this.txHistoryManager = txHistoryManager;
  }

  public async sendTransfer(transferRequest: TransferRequest): Promise<BroadCastResult> {
    // eslint-disable-next-line no-console
    console.log('TRANSFER_ASSET', transferRequest.asset);

    const currentAsset = transferRequest.asset;
    const scaledBaseAmount = getBaseScaledAmount(transferRequest.amount, currentAsset);

    const currentSession = await this.storageService.retrieveCurrentSession();
    const fromAddress = currentSession.activeAsset?.address ?? currentSession.wallet.address;
    const walletAddressIndex = currentSession.wallet.addressIndex;
    const walletDerivationPathStandard =
      currentSession.wallet.derivationPathStandard ?? DerivationPathStandard.BIP44;
    if (!transferRequest.memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      transferRequest.memo = DEFAULT_CLIENT_MEMO;
    }

    switch (currentAsset.assetType) {
      case UserAssetType.EVM:
        try {
          if (!currentAsset.address || !currentAsset.config?.nodeUrl) {
            throw TypeError(`Missing asset config: ${currentAsset.config}`);
          }

          const evmClient = EVMClient.create(currentAsset.config?.nodeUrl);

          const transfer: TransferTransactionUnsigned = {
            fromAddress: currentAsset.address,
            toAddress: transferRequest.toAddress,
            amount: String(scaledBaseAmount),
            memo: transferRequest.memo,
            accountNumber: 0,
            accountSequence: 0,
            asset: currentAsset,
          };

          const txConfig: Transaction = {
            from: currentAsset.address,
            to: transferRequest.toAddress,
            value: toWei(transferRequest.amount, 'ether'),
          };

          const prepareTxInfo = await this.transactionPrepareService.prepareEVMTransaction(
            currentAsset,
            txConfig,
          );

          transfer.nonce = prepareTxInfo.nonce;
          transfer.gasPrice = prepareTxInfo.loadedGasPrice;
          transfer.gasLimit = prepareTxInfo.gasLimit;

          const isMemoProvided = transferRequest.memo && transferRequest.memo.length > 0;
          // If transaction is provided with memo, add a little bit more gas to it to be accepted. 10% more
          transfer.gasLimit = isMemoProvided
            ? Number(transfer.gasLimit) + Number(transfer.gasLimit) * (10 / 100)
            : transfer.gasLimit;

          let signedTx = '';
          if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
            const device = createLedgerDevice();

            const gasLimitTx = ethers.BigNumber.from(transfer.gasLimit!).toHexString();
            const gasPriceTx = ethers.BigNumber.from(transfer.gasPrice).toHexString();
            signedTx = await device.signEthTx(
              walletAddressIndex,
              walletDerivationPathStandard,
              Number(transfer.asset?.config?.chainId), // chainid
              transfer.nonce,
              gasLimitTx /* gas limit */,
              gasPriceTx /* gas price */,
              transfer.toAddress,
              ethers.BigNumber.from(transfer.amount).toHexString(),
              `0x${Buffer.from(transfer.memo).toString('hex')}`,
            );
          } else {
            signedTx = await evmTransactionSigner.signTransfer(
              transfer,
              transferRequest.decryptedPhrase,
            );
          }

          const result = await evmClient.broadcastRawTransactionHex(signedTx);
          return {
            transactionHash: result,
            message: '',
            code: 200,
          };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(`ERROR_TRANSFERRING - ${currentAsset.assetType}`, e);
          throw TypeError(e as any);
        }

      case UserAssetType.CRC_20_TOKEN:
        try {
          // all CRC20 tokens shares the same chainConfig based on CRONOS native asset CRO's config
          // we can't simply update all CRC20 tokens' config to CRONOS native asset CRO's config while update node config in settings
          // because we can't take control with the future asset received in future, so we have to change it here in the very end, a little bit hacky
          const allAssets = await walletService.retrieveWalletAssets(
            currentSession.wallet.identifier,
          );
          const chainConfig = getCronosEvmAsset(allAssets)?.config;

          // currentAsset's config is not changeable, use a new instance instead
          const transferAsset: UserAsset = {
            ...currentAsset,
            config: chainConfig,
          };

          if (!transferAsset.address || !transferAsset.config || !transferAsset.contractAddress) {
            throw TypeError(`Missing asset config: ${transferAsset.config}`);
          }

          const cronosClient = new CronosClient(
            transferAsset.config?.nodeUrl,
            transferAsset.config?.indexingUrl,
          );

          const transfer: TransferTransactionUnsigned = {
            fromAddress,
            toAddress: transferRequest.toAddress,
            amount: String(scaledBaseAmount),
            memo: transferRequest.memo,
            accountNumber: 0,
            accountSequence: 0,
            asset: transferAsset,
          };

          const encodedABITokenTransfer = evmTransactionSigner.encodeTokenTransferABI(
            transferAsset.contractAddress,
            transfer,
          );

          const txConfig: Transaction = {
            from: transferAsset.address,
            to: transferAsset.contractAddress,
            value: 0,
            data: encodedABITokenTransfer,
          };

          const prepareTxInfo = await this.transactionPrepareService.prepareEVMTransaction(
            transferAsset,
            txConfig,
          );

          const staticTokenTransferGasLimit = 130_000;

          transfer.nonce = prepareTxInfo.nonce;
          transfer.gasPrice = Math.max(ethers.BigNumber.from(prepareTxInfo.loadedGasPrice).toNumber(), ethers.BigNumber.from(transferRequest.asset.config?.fee.networkFee!).toNumber()).toString();
          transfer.gasLimit = Math.max(staticTokenTransferGasLimit, ethers.BigNumber.from(transferRequest.asset.config?.fee.gasLimit!).toNumber());

          // eslint-disable-next-line no-console
          console.log('TX_DATA', { gasLimit: transfer.gasLimit });

          let signedTx = '';
          if (currentSession.wallet.walletType === LEDGER_WALLET_TYPE) {
            const device = createLedgerDevice();

            const gasLimitTx = ethers.BigNumber.from(transfer.gasLimit!).toHexString();
            const gasPriceTx = ethers.BigNumber.from(transfer.gasPrice!).toHexString();

            signedTx = await device.signEthTx(
              walletAddressIndex,
              walletDerivationPathStandard,
              Number(transfer.asset?.config?.chainId), // chainid
              transfer.nonce,
              gasLimitTx /* gas limit */,
              gasPriceTx /* gas price */,
              transferAsset.contractAddress,
              '0x0',
              encodedABITokenTransfer,
            );
          } else {
            signedTx = await evmTransactionSigner.signTokenTransfer(
              transfer,
              transferRequest.decryptedPhrase,
            );
          }

          const result = await cronosClient.broadcastRawTransactionHex(signedTx);
          return {
            transactionHash: result,
            message: '',
            code: 200,
          };
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log(
            `ERROR_TRANSFERRING_TOKEN - ${currentAsset.assetType} ${currentAsset.symbol}`,
            e,
          );
          throw TypeError(e as any);
        }

      case UserAssetType.TENDERMINT:
      case UserAssetType.IBC:
      case undefined: {
        const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

        const {
          nodeRpc,
          accountNumber,
          accountSequence,
          transactionSigner,
          cosmjsTendermintTransactionSigner,
          ledgerTransactionSigner,
        } = await this.transactionPrepareService.prepareTransaction();

        const transfer: TransferTransactionUnsigned = {
          fromAddress,
          toAddress: transferRequest.toAddress,
          amount: String(scaledBaseAmount),
          memo: transferRequest.memo,
          accountNumber,
          accountSequence,
          asset: transferRequest.asset,
        };

        let signedTxHex: string = '';

        if (transferRequest.walletType === LEDGER_WALLET_TYPE) {
          signedTxHex = await ledgerTransactionSigner.signTransfer(
            transfer,
            transferRequest.decryptedPhrase,
            networkFee,
            gasLimit,
          );
        } else if (transfer.asset?.name === SupportedChainName.CRONOS_TENDERMINT) {
          signedTxHex = await transactionSigner.signTransfer(
            transfer,
            transferRequest.decryptedPhrase,
            networkFee,
            gasLimit,
          );
        } else {
          signedTxHex = await cosmjsTendermintTransactionSigner.signTransfer(
            transfer,
            transferRequest.decryptedPhrase,
            networkFee,
            gasLimit,
          );
        }

        const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

        await Promise.all([
          await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
          // await this.txHistoryManager.fetchAndSaveTransfers(currentSession),
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
    } = await this.transactionPrepareService.prepareTransaction();

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
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (delegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signDelegateTx(
        delegateTransaction,
        delegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signDelegateTx(
        delegateTransaction,
        delegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndSaveRewards(nodeRpc, currentSession),
    ]);

    return broadCastResult;
  }

  public async sendRestakeRewardTransaction(
    restakeRequest: RestakeStakingRewardRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    const delegationAmountScaled = getBaseScaledAmount(restakeRequest.amount, restakeRequest.asset);

    let { memo } = restakeRequest;
    if (!memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      memo = DEFAULT_CLIENT_MEMO;
    }

    const restakeTransaction: RestakeStakingRewardTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: restakeRequest.validatorAddress,
      amount: String(delegationAmountScaled),
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (restakeRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signRestakeStakingRewardTx(
        restakeTransaction,
        restakeRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signRestakeStakingRewardTx(
        restakeTransaction,
        restakeRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
    ]);

    return broadCastResult;
  }

  public async sendRestakeAllRewardsTransaction(
    restakeRequest: RestakeStakingAllRewardsRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    let { memo } = restakeRequest;
    if (!memo && !currentSession.wallet.config.disableDefaultClientMemo) {
      memo = DEFAULT_CLIENT_MEMO;
    }

    const restakeAllRewardsTransaction: RestakeStakingAllRewardsTransactionUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddressList: restakeRequest.validatorAddressList,
      amountList: restakeRequest.amountList.map(rewardAmount =>
        getBaseScaledAmount(rewardAmount, restakeRequest.asset),
      ),
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (restakeRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signRestakeAllStakingRewardsTx(
        restakeAllRewardsTransaction,
        restakeRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signRestakeAllStakingRewardsTx(
        restakeAllRewardsTransaction,
        restakeRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
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
    } = await this.transactionPrepareService.prepareTransaction();

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
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (undelegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signUndelegateTx(
        undelegateTransaction,
        undelegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signUndelegateTx(
        undelegateTransaction,
        undelegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndSaveRewards(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndSaveUnbondingDelegations(nodeRpc, currentSession),
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
    } = await this.transactionPrepareService.prepareTransaction();

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
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (redelegationRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signRedelegateTx(
        redelegateTransactionUnsigned,
        redelegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signRedelegateTx(
        redelegateTransactionUnsigned,
        redelegationRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndSaveRewards(nodeRpc, currentSession),
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
    } = await this.transactionPrepareService.prepareTransaction();

    const voteTransactionUnsigned: VoteTransactionUnsigned = {
      option: voteRequest.voteOption,
      voter: currentSession.wallet.address,
      proposalID: voteRequest.proposalID,
      memo: voteRequest.memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (voteRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signVoteTransaction(
        voteTransactionUnsigned,
        voteRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signVoteTransaction(
        voteTransactionUnsigned,
        voteRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.txHistoryManager.fetchAndSaveProposals(currentSession);
    return broadCastResult;
  }

  public async sendMsgDepositTx(
    depositRequest: DepositToProposalRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    const depositToProposalUnsigned: MsgDepositTransactionUnsigned = {
      proposalId: depositRequest.proposalId,
      depositor: depositRequest.depositor,
      amount: depositRequest.amount,
      memo: '', // Todo: This can be brought up in future transactions
      accountNumber,
      accountSequence,
    };
    
    let signedTxHex: string = '';
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (depositRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signProposalDepositTransaction(
        depositToProposalUnsigned,
        depositRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signProposalDepositTransaction(
        depositToProposalUnsigned,
        depositRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.txHistoryManager.fetchAndSaveProposals(currentSession);
    return broadCastResult;
  }

  /**
   *
   * @param textProposalSubmitRequest
   */
  public async sendSubmitTextProposalTransaction(
    textProposalSubmitRequest: TextProposalRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    const minDeposit = '100';
    if(Big(textProposalSubmitRequest.initialDeposit[0].amount).cmp(Big(minDeposit)) === -1){
      return await nodeRpc.broadcastTransaction('');
    }

    const submitTextProposalUnsigned: TextProposalTransactionUnsigned = {
      params: {
        description: textProposalSubmitRequest.description,
        title: textProposalSubmitRequest.title,
      },
      proposer: textProposalSubmitRequest.proposer,
      initialDeposit: textProposalSubmitRequest.initialDeposit,
      memo: '', // Todo: This can be brought up in future transactions
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (textProposalSubmitRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signSubmitTextProposalTransaction(
        submitTextProposalUnsigned,
        textProposalSubmitRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signSubmitTextProposalTransaction(
        submitTextProposalUnsigned,
        textProposalSubmitRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await this.txHistoryManager.fetchAndSaveProposals(currentSession);

    return broadCastResult;
  }

  public async sendNFT(nftTransferRequest: NFTTransferRequest): Promise<BroadCastResult> {
    const currentSession = await this.storageService.retrieveCurrentSession();

    switch (nftTransferRequest.nftType) {
      case NftType.CRONOS_TENDERMINT: {
        const {
          nodeRpc,
          accountNumber,
          accountSequence,
          transactionSigner,
          ledgerTransactionSigner,
        } = await this.transactionPrepareService.prepareTransaction();

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

        let signedTxHex = '';
        const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

        if (nftTransferRequest.walletType === LEDGER_WALLET_TYPE) {
          signedTxHex = await ledgerTransactionSigner.signNFTTransfer(
            nftTransferUnsigned,
            nftTransferRequest.decryptedPhrase,
            networkFee,
            gasLimit,
          );
        } else {
          signedTxHex = await transactionSigner.signNFTTransfer(
            nftTransferUnsigned,
            nftTransferRequest.decryptedPhrase,
            networkFee,
            gasLimit,
          );
        }

        // It takes a few seconds for the indexing service to sync latest NFT state
        await sleep(7_000);
        await Promise.all([
          this.txHistoryManager.fetchAndSaveNFTs(currentSession),
          this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
        ]);

        const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

        return broadCastResult;
      }
      case NftType.CRC_721_TOKEN: {
        const {
          sender,
          recipient,
          tokenId,
          tokenContractAddress,
          asset,
          decryptedPhrase,
        } = nftTransferRequest;

        if (!asset.config?.nodeUrl) {
          throw TypeError(`Missing asset config: ${asset.config}`);
        }

        const encodedABITokenTransferData = evmTransactionSigner.encodeNFTTransferABI(
          tokenContractAddress,
          {
            tokenId,
            sender,
            recipient,
          },
        );

        const estimatedGasLimit = await evmTransactionSigner.getNFTSafeTransferFromEstimatedGas(
          asset,
          tokenContractAddress,
          {
            tokenId,
            sender,
            recipient,
          },
        );

        const prepareTXConfig: Transaction = {
          from: sender,
          to: recipient,
          data: encodedABITokenTransferData,
        };

        const prepareTxInfo = await this.transactionPrepareService.prepareEVMTransaction(
          asset,
          prepareTXConfig,
        );

        const txConfig: EVMContractCallUnsigned = {
          from: sender,
          contractAddress: tokenContractAddress,
          data: encodedABITokenTransferData,
          nonce: prepareTxInfo.nonce,
          gasPrice: ethers.utils.hexValue(BigInt(prepareTxInfo.loadedGasPrice)),
          gasLimit: ethers.utils.hexValue(estimatedGasLimit),
        };

        try {
          const session = await walletService.retrieveCurrentSession();
          const isTestnet = checkIfTestnet(session.wallet.config.network);
          const chainConfig = !isTestnet ? CronosMainnetChainConfig : CronosTestnetChainConfig;

          const result = await EvmTransactionSigner.sendContractCallTransaction({
            chainConfig,
            transaction: txConfig,
            mnemonic: decryptedPhrase,
          });

          await sleep(7_000);
          await Promise.all([
            this.txHistoryManager.fetchAndSaveNFTs(currentSession),
            this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
          ]);

          const broadCastResult = {
            transactionHash: result,
            message: '',
            code: 200,
          };

          return broadCastResult;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.log(
            `ERROR_TRANSFERRING_NFT - ${nftTransferRequest.tokenContractAddress}_${nftTransferRequest.tokenId}`,
            error,
          );
          throw error;
        }
      }
      default:
        throw TypeError('NFT Type Not supported yet');
    }
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
    } = await this.transactionPrepareService.prepareTransaction();

    const withdrawStakingReward: WithdrawStakingRewardUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddress: rewardWithdrawRequest.validatorAddress,
      memo: DEFAULT_CLIENT_MEMO,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;

    const { gasLimit, networkFee } = await getCronosTendermintFeeConfig();

    if (rewardWithdrawRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signWithdrawStakingRewardTx(
        withdrawStakingReward,
        rewardWithdrawRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signWithdrawStakingRewardTx(
        withdrawStakingReward,
        rewardWithdrawRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndSaveRewards(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
    ]);
    return broadCastResult;
  }

  public async sendStakingWithdrawAllRewardsTx(
    rewardWithdrawAllRequest: WithdrawAllStakingRewardRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    const withdrawAllStakingReward: WithdrawAllStakingRewardsUnsigned = {
      delegatorAddress: currentSession.wallet.address,
      validatorAddressList: rewardWithdrawAllRequest.validatorAddressList,
      memo: DEFAULT_CLIENT_MEMO,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string;

    const { gasLimit, networkFee } = await getCronosTendermintFeeConfig();

    if (rewardWithdrawAllRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signWithdrawAllStakingRewardsTx(
        withdrawAllStakingReward,
        rewardWithdrawAllRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signWithdrawAllStakingRewardsTx(
        withdrawAllStakingReward,
        rewardWithdrawAllRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);
    await Promise.all([
      await this.txHistoryManager.fetchAndSaveRewards(nodeRpc, currentSession),
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
    ]);
    return broadCastResult;
  }

  public async sendBridgeTransaction(bridgeTransferRequest: BridgeTransferRequest) {
    const currentSession = await this.storageService.retrieveCurrentSession();

    const bridgeService = new BridgeService(this.storageService);

    const bridgeTransactionResult = await bridgeService.handleBridgeTransaction(
      bridgeTransferRequest,
    );

    await Promise.all([
      await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
      // await this.txHistoryManager.fetchAndSaveTransfers(currentSession),
    ]);

    return bridgeTransactionResult;
  }

  /* _________________________
        NFT RELATED FUNCTIONS  
     _________________________ */

  public async sendMintNFT(nftMintRequest: NFTMintRequest): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

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
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (nftMintRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signNFTMint(
        nftMintUnsigned,
        nftMintRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signNFTMint(
        nftMintUnsigned,
        nftMintRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

    // It takes a few seconds for the indexing service to sync latest NFT state
    await sleep(5_000);
    await Promise.all([
      this.txHistoryManager.fetchAndSaveNFTs(currentSession),
      this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
    return broadCastResult;
  }

  public async sendNFTDenomIssueTx(
    nftDenomIssueRequest: NFTDenomIssueRequest,
  ): Promise<BroadCastResult> {
    const {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      ledgerTransactionSigner,
    } = await this.transactionPrepareService.prepareTransaction();

    const memo = !nftDenomIssueRequest.memo ? DEFAULT_CLIENT_MEMO : nftDenomIssueRequest.memo;

    const nftDenomIssueUnsigned: NFTDenomIssueUnsigned = {
      ...nftDenomIssueRequest,
      memo,
      accountNumber,
      accountSequence,
    };

    let signedTxHex: string = '';
    const { networkFee, gasLimit } = await getCronosTendermintFeeConfig();

    if (nftDenomIssueRequest.walletType === LEDGER_WALLET_TYPE) {
      signedTxHex = await ledgerTransactionSigner.signNFTDenomIssue(
        nftDenomIssueUnsigned,
        nftDenomIssueRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    } else {
      signedTxHex = await transactionSigner.signNFTDenomIssue(
        nftDenomIssueUnsigned,
        nftDenomIssueRequest.decryptedPhrase,
        networkFee,
        gasLimit,
      );
    }

    const broadCastResult = await nodeRpc.broadcastTransaction(signedTxHex);

    // It takes a few seconds for the indexing service to sync latest NFT state
    await sleep(5_000);
    await Promise.all([
      this.txHistoryManager.fetchAndSaveNFTs(currentSession),
      this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
    ]);
    return broadCastResult;
  }
}
