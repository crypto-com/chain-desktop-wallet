import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
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
    expect(testNetWallet.config.network.chainId).to.eq('testnet-croeseid-2');

    expect(testNetWallet.address.startsWith('tcro')).to.eq(true);
    expect(testNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(testNetWallet.identifier.length).to.eq(16);
  });

  it('Test creating a new wallet with main-net configuration', () => {
    const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

    const createOptions: WalletCreateOptions = {
      config: mainNetConfig,
      walletName: 'My-MainNet-Wallet',
    };
    const mainNetWallet = WalletCreator.create(createOptions);

    expect(mainNetWallet.name).to.eq('My-MainNet-Wallet');
    expect(mainNetWallet.config).to.eq(mainNetConfig);

    expect(mainNetWallet.address.startsWith('cro')).to.eq(true);
    expect(mainNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(mainNetWallet.identifier.length).to.eq(16);
  });

  it('Test creating wallet from custom configurations ', () => {
    const customConfig: WalletConfig = {
      enabled: false,
      derivationPath: "44'/245'/0'/0/0",
      name: 'Pystaport-Custom-Network',
      network: {
        chainId: 'pystaportnet',
        addressPrefix: 'pcro',
        validatorAddressPrefix: 'pcrocncl',
        validatorPubKeyPrefix: 'pcrocnclconspub',
        coin: {
          baseDenom: 'basepcro',
          croDenom: 'pcro',
        },
        bip44Path: {
          coinType: 1,
          account: 0,
        },
      },
      nodeUrl: '123.18.45.12:3400',
    };

    const createOptions: WalletCreateOptions = {
      config: customConfig,
      walletName: 'My-Custom-Config-Wallet',
    };
    const customWallet = WalletCreator.create(createOptions);

    expect(customWallet.address.startsWith('pcro')).to.eq(true);
    expect(customWallet.config).to.eq(customConfig);
    expect(customWallet.config.network.chainId).to.eq('pystaportnet');
  });
});
