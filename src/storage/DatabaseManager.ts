import Datastore from 'nedb-promises';

export class DatabaseManager {
  public readonly sessionStore: Datastore;

  public readonly walletStore: Datastore;

  public readonly assetStore: Datastore;

  constructor(namespace: string) {
    this.sessionStore = Datastore.create(`./data/${namespace}.session.db`);
    this.walletStore = Datastore.create(`./data/${namespace}.wallets.db`);
    this.assetStore = Datastore.create(`./data/${namespace}.assets.db`);
  }
}
