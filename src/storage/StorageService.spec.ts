import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from '../service/WalletCreator';
import { mockStorageService } from './StorageService';

describe('Testing Storage Service', () => {
  it('Test creating and storing a new wallet', async () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const createOptions: WalletCreateOptions = {
      config: testNetConfig,
      walletName: 'My-TestNet-Wallet',
    };
    const wallet = WalletCreator.create(createOptions);
    const walletId = wallet.identifier;

    await mockStorageService.saveWallet(wallet);

    const loadedWallet = await mockStorageService.findWalletById(walletId);

    expect(loadedWallet);
  });
});
