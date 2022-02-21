import Datastore from 'nedb-promises';

function getStore(namespace: string, store: string) {
  return Datastore.create(`./data/${namespace}.${store}.db`);
}

export class DatabaseManager {
  public readonly sessionStore: Datastore;

  public readonly walletStore: Datastore;

  public readonly assetStore: Datastore;

  public readonly marketPriceStore: Datastore;

  // public readonly transferStore: Datastore;

  // public readonly stakingStore: Datastore;

  // public readonly rewardStore: Datastore;

  public readonly unbondingDelegationStore: Datastore;

  public readonly seedStore: Datastore;

  public readonly credentialStore: Datastore;

  public readonly validatorStore: Datastore;

  public readonly proposalStore: Datastore;

  public readonly nftStore: Datastore;

  // public readonly nftTransferHistoryStore: Datastore;

  // public readonly nftAccountTxStore: Datastore;

  // This is for configuration that span across all wallets
  public readonly generalConfigStore: Datastore;

  public readonly bridgeConfigStore: Datastore;

  // public readonly bridgeTransactionStore: Datastore;

  public readonly commonTransactionStore: Datastore;

  public readonly commonAttributeStore: Datastore;

  public readonly addressBookStore: Datastore;

  public readonly dappBrowserBookmarksStore: Datastore;

  constructor(namespace: string) {
    this.sessionStore = getStore(namespace, 'session');
    this.walletStore = getStore(namespace, 'wallets');
    this.assetStore = getStore(namespace, 'assets');
    this.marketPriceStore = getStore(namespace, 'markets-prices');

    // @deprecated
    // this.transferStore = getStore(namespace, 'transfers');

    // @deprecated
    // this.stakingStore = getStore(namespace, 'staking');

    // @deprecated
    // this.rewardStore = getStore(namespace, 'rewards');

    this.unbondingDelegationStore = getStore(namespace, 'unbondingDelegations');
    this.credentialStore = getStore(namespace, 'credential');
    this.seedStore = getStore(namespace, 'seeds');
    this.validatorStore = getStore(namespace, 'validators');
    this.proposalStore = getStore(namespace, 'proposals');
    this.nftStore = getStore(namespace, 'nftStore');
    this.generalConfigStore = getStore(namespace, 'generalConfigStore');
    // @deprecated
    // this.nftTransferHistoryStore = getStore(namespace, 'nftTransferHistoryStore');

    // @deprecated
    // this.nftAccountTxStore = getStore(namespace, 'nftAccountTxStore');
    this.bridgeConfigStore = getStore(namespace, 'bridgeConfigStore');

    // @deprecated
    // this.bridgeTransactionStore = getStore(namespace, 'bridgeTransactionStore');

    this.commonTransactionStore = getStore(namespace, 'commonTransactionStore');
    this.commonAttributeStore = getStore(namespace, 'commonAttributeStore');
    this.addressBookStore = getStore(namespace, 'addressBook');
    this.dappBrowserBookmarksStore = getStore(namespace, 'dappBrowserBookmarksStore');
  }
}
