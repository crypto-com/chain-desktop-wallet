// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';

class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public saveWallet(wallet: Wallet) {
    return this.db.walletStore.insert(wallet);
  }

  public async findWalletById(id: string) {
    return this.db.walletStore.findOne({ identifier: id });
  }

  public fetchWallets() {
    return this.db.walletStore.find({}).exec();
  }
}

export const storageService = new StorageService('');
export const mockStorageService = new StorageService('mock-db');
