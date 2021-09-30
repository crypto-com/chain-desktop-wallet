import { NodeRpcService } from './rpc/NodeRpcService';
import { TransactionSigner } from './signers/TransactionSigner';
import { ISignerProvider } from './signers/SignerProvider';
import { createLedgerDevice } from './LedgerService';
import { LedgerTransactionSigner } from './signers/LedgerTransactionSigner';
import { StorageService } from '../storage/StorageService';
import { APP_DB_NAMESPACE } from '../config/StaticConfig';

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
}
