// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';

class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public saveWallet(wallet: Wallet) {
    return this.db.walletStore.insert(wallet);
  }

  public async findWalletById(id: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier: id });
  }

  public fetchWallets() {
    return this.db.walletStore.find<Wallet>({}).exec();
  }

  public async setSession(session: Session) {
    await this.db.sessionStore.remove({}, {});
    return this.db.sessionStore.insert({ _id: Session.SESSION_ID, ...session });
  }

  public retrieveCurrentSession() {
    return this.db.sessionStore.findOne<Session>({ _id: Session.SESSION_ID });
  }
}

export const storageService = new StorageService('');
export const mockStorageService = new StorageService('mock-db');
