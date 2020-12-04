import Datastore from 'nedb-promises';
import { Wallet } from '../models/Wallet';

class DatabaseManager {
  public readonly appDB: Datastore;

  public readonly walletStore: Datastore;

  constructor(namespace: String) {
    this.appDB = Datastore.create(`./${namespace}app.db`);
    this.walletStore = Datastore.create(`./${namespace}app.wallets.db`);
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class StorageService {
  public readonly db: DatabaseManager;

  constructor() {
    this.db = new DatabaseManager('');
  }

  public saveWallet(wallet: Wallet) {
    return this.db.walletStore.insert(wallet);
  }

  public fetchWallets() {
    return this.db.walletStore.find({}).exec();
  }
}
