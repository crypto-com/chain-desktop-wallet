import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from '../service/WalletCreator';
import { mockStorageService } from './StorageService';
import { Session } from '../models/Session';

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
    const walletId = wallet.identifier;

    // Persist wallet in the db
    await mockStorageService.saveWallet(wallet);

    const loadedWallet = await mockStorageService.findWalletById(walletId);
    expect(loadedWallet.name).to.eq('My-TestNet-Wallet');
    expect(loadedWallet.address).to.eq(newWalletAddress);
    expect(loadedWallet.config.network.chainId).to.eq('testnet-croeseid-1');
  });

  it('Test session storage ', async () => {
    const wallet = buildTestWallet();
    const walletId = wallet.identifier;
    const session = new Session(wallet);

    // Persist session in the db
    await mockStorageService.setSession(session);

    const currentSession = await mockStorageService.retrieveCurrentSession();
    expect(currentSession.wallet.name).to.eq('My-TestNet-Wallet');
    expect(currentSession.wallet.identifier).to.eq(walletId);
    // eslint-disable-next-line no-underscore-dangle
    expect(currentSession._id).to.eq(Session.SESSION_ID);
  });
});
