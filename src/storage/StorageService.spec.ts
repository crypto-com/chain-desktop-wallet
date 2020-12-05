import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from '../service/WalletCreator';
import { StorageService } from './StorageService';
import { Session } from '../models/Session';
import { Wallet } from '../models/Wallet';
import { getRandomId } from '../crypto/RandomGen';

function buildTestWallet() {
  const testNetConfig = DefaultWalletConfigs.TestNetConfig;

  const createOptions: WalletCreateOptions = {
    config: testNetConfig,
    walletName: 'My-TestNet-Wallet',
  };
  return WalletCreator.create(createOptions);
}

describe('Testing Storage Service', () => {
  it('Test creating and storing a new wallet', async () => {
    const wallet = buildTestWallet();
    const newWalletAddress = wallet.address;
    const walletIdentifier = wallet.identifier;

    const mockWalletStore = new StorageService(`test-wallet-storage-${getRandomId()}`);

    // Persist wallet in the db
    await mockWalletStore.saveWallet(wallet);

    const loadedWallet = await mockWalletStore.findWalletByIdentifier(walletIdentifier);
    expect(loadedWallet.name).to.eq('My-TestNet-Wallet');
    expect(loadedWallet.address).to.eq(newWalletAddress);
    expect(loadedWallet.config.network.chainId).to.eq('testnet-croeseid-1');
  });

  it('Test session storage ', async () => {
    const wallet = buildTestWallet();
    const walletIdentifier = wallet.identifier;
    const session = new Session(wallet);

    const mockWalletStore = new StorageService(`test-session-storage-${getRandomId()}`);
    // Persist session in the db
    await mockWalletStore.setSession(session);

    const currentSession = await mockWalletStore.retrieveCurrentSession();
    expect(currentSession.wallet.name).to.eq('My-TestNet-Wallet');
    expect(currentSession.wallet.identifier).to.eq(walletIdentifier);
    // eslint-disable-next-line no-underscore-dangle
    expect(currentSession._id).to.eq(Session.SESSION_ID);
  });

  it('Test loading all persisted wallets', async () => {
    const mockWalletStore = new StorageService(`test-load-all-${getRandomId()}`);
    for (let i = 0; i < 10; i++) {
      const wallet: Wallet = buildTestWallet();
      mockWalletStore.saveWallet(wallet);
    }

    const fetchedWallets = await mockWalletStore.fetchWallets();
    expect(fetchedWallets.length).to.eq(10);
  });
});
