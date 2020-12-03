import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';

describe('Testing Wallet Creation', () => {
  it('Test creating a new wallet with testnet configuration', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const createOptions: WalletCreateOptions = {
      config: testNetConfig,
      walletName: 'My-TestNet-Wallet',
    };
    const testNetWallet = WalletCreator.create(createOptions);

    expect(testNetWallet.name).to.eq('My-TestNet-Wallet');
    expect(testNetWallet.config).to.eq(testNetConfig);
    expect(testNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(testNetWallet.id.length).to.eq(12);
  });

  it('Test creating a new wallet with main-net configuration', () => {
    const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

    const createOptions: WalletCreateOptions = {
      config: mainNetConfig,
      walletName: 'My-MainNet-Wallet',
    };
    const testNetWallet = WalletCreator.create(createOptions);

    expect(testNetWallet.name).to.eq('My-MainNet-Wallet');
    expect(testNetWallet.config).to.eq(mainNetConfig);
    expect(testNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(testNetWallet.id.length).to.eq(12);
  });
});
