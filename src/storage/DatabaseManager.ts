import Datastore from 'nedb-promises';

function getStore(namespace: string, store: string) {
  return Datastore.create(`./data/${namespace}.${store}.db`);
}

export class DatabaseManager {
  public readonly sessionStore: Datastore;

  public readonly walletStore: Datastore;

  public readonly assetStore: Datastore;

  public readonly marketPriceStore: Datastore;

  public readonly transferStore: Datastore;

  public readonly stakingStore: Datastore;

  public readonly rewardStore: Datastore;

  public readonly seedStore: Datastore;

  public readonly credentialStore: Datastore;

  public readonly validatorStore: Datastore;

  constructor(namespace: string) {
    this.sessionStore = getStore(namespace, 'session');
    this.walletStore = getStore(namespace, 'wallets');
    this.assetStore = getStore(namespace, 'assets');
    this.marketPriceStore = getStore(namespace, 'markets-prices');
    this.transferStore = getStore(namespace, 'transfers');
    this.stakingStore = getStore(namespace, 'staking');
    this.rewardStore = getStore(namespace, 'rewards');
    this.credentialStore = getStore(namespace, 'credential');
    this.seedStore = getStore(namespace, 'seeds');
    this.validatorStore = getStore(namespace, 'validators');
  }
}
