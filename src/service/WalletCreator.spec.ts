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
    expect(testNetWallet.config.network.chainId).to.eq('testnet-croeseid-1');

    expect(testNetWallet.address.startsWith('tcro')).to.eq(true);
    expect(testNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(testNetWallet.id.length).to.eq(12);
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
    expect(mainNetWallet.id.length).to.eq(12);
  });

  it('Test creating wallet from custom configurations ', () => {
    const customConfig: WalletConfig = {
      derivationPath: "44'/245'/0'/0/0",
      name: 'Pystaport-Custom-Network',
      network: {
        chainId: 'chainmaind',
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
    expect(customWallet.config.network.chainId).to.eq('Pystaport-Custom-Network');
  });
});
