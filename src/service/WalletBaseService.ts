import Web3 from 'web3';
import { HttpProvider } from 'web3-core';
import { TransactionConfig } from 'web3-eth';
import { NodeRpcService } from './rpc/NodeRpcService';
import { TransactionSigner } from './signers/TransactionSigner';
import { ISignerProvider } from './signers/SignerProvider';
import { createLedgerDevice } from './LedgerService';
import { LedgerTransactionSigner } from './signers/LedgerTransactionSigner';
import { StorageService } from '../storage/StorageService';
import { APP_DB_NAMESPACE } from '../config/StaticConfig';
import { UserAsset } from '../models/UserAsset';
import { CronosClient } from './cronos/CronosClient';

export class WalletBaseService {
  public readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
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
  public async prepareEVMTransaction(originAsset: UserAsset, txConfig: TransactionConfig) {
    if (!originAsset.config?.nodeUrl || !originAsset.address) {
      throw TypeError(`Missing asset config: ${originAsset.config}`);
    }

    const cronosClient = new CronosClient(
      originAsset.config?.nodeUrl,
      originAsset.config?.indexingUrl,
    );

    const web3 = new Web3(new HttpProvider(originAsset.config?.nodeUrl));

    const nonce = await cronosClient.getNextNonceByAddress(originAsset.address);
    const loadedGasPrice = Number(
      web3.utils.toWei(await cronosClient.getEstimatedGasPrice(), 'gwei'),
    );
    const gasLimit = Number(await cronosClient.estimateGas(txConfig));

    // eslint-disable-next-line no-console
    console.log('EVM_TX', {
      txNonce: nonce,
      gasPrice: loadedGasPrice,
      gasLimit,
    });

    return {
      nonce,
      loadedGasPrice,
      gasLimit,
    };
  }
}
