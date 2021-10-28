import Web3 from 'web3';
import { TransactionConfig } from 'web3-eth';
import { DelegateTransactionUnsigned, TransferTransactionUnsigned, UndelegateTransactionUnsigned, RedelegateTransactionUnsigned, VoteTransactionUnsigned, NFTTransferUnsigned, WithdrawStakingRewardUnsigned, NFTDenomIssueUnsigned, NFTMintUnsigned } from './signers/TransactionSupported';
import { BroadCastResult } from '../models/Transaction';
import { getBaseScaledAmount } from '../utils/NumberUtils';
import { UserAssetType } from '../models/UserAsset';
import { DEFAULT_CLIENT_MEMO } from '../config/StaticConfig';
import { TransferRequest, DelegationRequest, UndelegationRequest, RedelegationRequest, VoteRequest, NFTTransferRequest, WithdrawStakingRewardRequest, BridgeTransferRequest, NFTDenomIssueRequest, NFTMintRequest } from './TransactionRequestModels';
import { StorageService } from '../storage/StorageService';
import { CronosClient } from './cronos/CronosClient';
import { TransactionPrepareService } from './TransactionPrepareService';
import { evmTransactionSigner } from './signers/EvmTransactionSigner';
import { LEDGER_WALLET_TYPE, createLedgerDevice } from './LedgerService';
import { TransactionHistoryService } from './TransactionHistoryService';
import { sleep } from '../utils/utils';
import { BridgeService } from './bridge/BridgeService';

export class TransactionSenderService {
    public readonly storageService: StorageService;

    public readonly transactionPrepareService: TransactionPrepareService;

    public readonly txHistoryManager: TransactionHistoryService;

    constructor(storageService: StorageService, transactionPrepareService: TransactionPrepareService, txHistoryManager: TransactionHistoryService) {
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

                    const result = await cronosClient.broadcastRawTransactionHex(signedTx);
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
                } = await this.transactionPrepareService.prepareTransaction();

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
                    await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
                    await this.txHistoryManager.fetchAndSaveTransfers(currentSession),
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
            await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
            await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
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
            await this.txHistoryManager.fetchAndUpdateBalances(currentSession),
            await this.txHistoryManager.fetchAndSaveDelegations(nodeRpc, currentSession),
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
        await this.txHistoryManager.fetchAndSaveProposals(currentSession);
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
            this.txHistoryManager.fetchAndSaveNFTs(currentSession),
            this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
        ]);
        return broadCastResult;
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
            await this.txHistoryManager.fetchAndSaveTransfers(currentSession),
        ]);

        return bridgeTransactionResult;
    }


    /* _______________________
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
            this.txHistoryManager.fetchAndSaveNFTs(currentSession),
            this.txHistoryManager.fetchAndSaveNFTAccountTxs(currentSession),
        ]);
        return broadCastResult;
    }
}