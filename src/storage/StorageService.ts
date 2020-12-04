// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';

class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async saveWallet(wallet: Wallet) {
    return this.db.walletStore.insert(wallet);
  }

  public async findWalletById(id: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier: id });
  }

  public async fetchWallets() {
    return this.db.walletStore.find<Wallet>({}).exec();
  }

  public async setSession(session: Session) {
    return this.db.sessionStore.update(
      { _id: Session.SESSION_ID },
      { $set: session },
      { upsert: true },
    );
  }

  public retrieveCurrentSession() {
    return this.db.sessionStore.findOne<Session>({ _id: Session.SESSION_ID });
  }
}

export const storageService = new StorageService('');
export const mockStorageService = new StorageService('mock-db');
