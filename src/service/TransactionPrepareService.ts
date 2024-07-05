import { Transaction } from 'web3-types';
import { NodeRpcService } from './rpc/NodeRpcService';
import { TransactionSigner } from './signers/TransactionSigner';
import { CosmjsTendermintTransactionSigner } from './signers/CosmjsTendermintTransactionSigner';
import { ISignerProvider } from './signers/SignerProvider';
import { createLedgerDevice } from './LedgerService';
import { LedgerTransactionSigner } from './signers/LedgerTransactionSigner';
import { StorageService } from './storage/StorageService';
import { UserAsset } from '../models/UserAsset';
import { CronosClient } from './cronos/CronosClient';
import { PrepareEVMTransaction, TenderMintTransactionPrepared } from './Models';
import { DerivationPathStandard } from './signers/LedgerSigner';

export class TransactionPrepareService {
  public readonly storageService: StorageService;

  constructor(storageService: StorageService) {
    this.storageService = storageService;
  }

  public async prepareTransaction(): Promise<TenderMintTransactionPrepared> {
    const currentSession = await this.storageService.retrieveCurrentSession();
    const currentWallet = currentSession.wallet;
    const nodeRpc = await NodeRpcService.init({
      baseUrl: currentSession.wallet.config.nodeUrl,
      proxyUrl: currentSession.activeAsset?.config?.tendermintNetwork?.node?.proxyUrl ?? '',
      clientUrl: currentSession.activeAsset?.config?.tendermintNetwork?.node?.clientUrl ?? '',
    });

    const [accountNumber, accountSequence, latestBlock] = await Promise.all([
      nodeRpc.fetchAccountNumber(currentSession.activeAsset?.address ?? currentSession.wallet.address),
      nodeRpc.loadSequenceNumber(currentSession.activeAsset?.address ?? currentSession.wallet.address),
      nodeRpc.loadLatestBlock(),
    ]);

    const transactionSigner = new TransactionSigner(currentWallet.config);
    const cosmjsTendermintTransactionSigner = new CosmjsTendermintTransactionSigner(
      currentWallet.config,
    );
    const signerProvider: ISignerProvider = createLedgerDevice();

    const tmpWalletConfig = currentWallet.config;

    // eslint-disable-next-line no-console
    console.log('PREPARE_TX: ', {
      latestBlock,
      address: currentSession.activeAsset?.address!,
      accountNumber,
      accountSequence,
      chainId: currentSession.activeAsset?.config?.chainId,
    });

    const ledgerTransactionSigner = new LedgerTransactionSigner(
      // currentWallet.config,
      tmpWalletConfig,
      signerProvider,
      currentWallet.addressIndex,
      currentWallet.derivationPathStandard ?? DerivationPathStandard.BIP44,
    );
    return {
      nodeRpc,
      accountNumber,
      accountSequence,
      currentSession,
      transactionSigner,
      cosmjsTendermintTransactionSigner,
      ledgerTransactionSigner,
      latestBlock,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  public async prepareEVMTransaction(
    originAsset: UserAsset,
    txConfig: Transaction,
  ): Promise<PrepareEVMTransaction> {
    const currentSession = await this.storageService.retrieveCurrentSession();

    if (!originAsset.config?.nodeUrl || !originAsset.address) {
      throw TypeError(`Missing asset config: ${originAsset.config}`);
    }

    const cronosClient = new CronosClient(
      originAsset.config?.nodeUrl,
      originAsset.config?.indexingUrl,
    );

    const nonce = await cronosClient.getNextNonceByAddress(originAsset.address);
    const loadedGasPrice = await cronosClient.getEstimatedGasPrice();
    let gasLimit;
    try {
      gasLimit = await cronosClient.estimateGas(txConfig);
    } catch (e) {
      gasLimit = 21_000; // Default gasLimit
    }

    // eslint-disable-next-line no-console
    console.log('PREPARE_TX', {
      address: originAsset.address,
      txNonce: nonce,
      gasPrice: loadedGasPrice,
      gasLimit,
      chainId: originAsset?.config?.chainId,
    });

    return {
      nonce,
      loadedGasPrice,
      gasLimit,
      currentSession,
    };
  }
}
