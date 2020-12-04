import Datastore from 'nedb-promises';

export class DatabaseManager {
  public readonly appDB: Datastore;

  public readonly walletStore: Datastore;

  constructor(namespace: string) {
    this.appDB = Datastore.create(`./${namespace}app.db`);
    this.walletStore = Datastore.create(`./${namespace}app.wallets.db`);
  }
}
