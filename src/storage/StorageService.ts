// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Wallet } from '../models/Wallet';
import { DatabaseManager } from './DatabaseManager';
import { Session } from '../models/Session';

export class StorageService {
  private readonly db: DatabaseManager;

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async saveWallet(wallet: Wallet) {
    return this.db.walletStore.insert(wallet);
  }

  public async findWalletByIdentifier(identifier: string) {
    return this.db.walletStore.findOne<Wallet>({ identifier });
  }

  public async fetchWallets() {
    return this.db.walletStore.find<Wallet>({});
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
