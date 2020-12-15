import { StorageService } from '../storage/StorageService';
import { APP_DB_NAMESPACE } from '../config/StaticConfig';
import { StakingTransactionData, TransferTransactionData } from '../models/Transaction';

class TransactionService {
  private readonly storageService: StorageService;

  constructor() {
    this.storageService = new StorageService(APP_DB_NAMESPACE);
  }

  public async saveTransfer(transferTx: TransferTransactionData) {
    return this.storageService.saveTransferTransaction(transferTx);
  }

  public async retrieveAllTransferTxs(): Promise<TransferTransactionData[]> {
    const transactions = await this.storageService.retrieveAllTransferTransactions();
    return transactions.map(data => {
      const transferTransaction: TransferTransactionData = { ...data };
      return transferTransaction;
    });
  }

  public async saveStakingTransaction(stakingTx: StakingTransactionData) {
    return this.storageService.saveStakingTransaction(stakingTx);
  }

  public async retrieveAllStakingTxs(): Promise<StakingTransactionData[]> {
    const transactions = await this.storageService.retrieveAllStakingTransactions();
    return transactions.map(data => {
      const stakingTransaction: StakingTransactionData = { ...data };
      return stakingTransaction;
    });
  }
}

export const transactionService = new TransactionService();
