import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { WalletCreateOptions, WalletCreator } from './WalletCreator';
import { UserAssetType } from '../models/UserAsset';

describe('Testing Wallet Creation', () => {
  it('Test creating a new wallet with testnet configuration', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const createOptions: WalletCreateOptions = {
      addressIndex: 0,
      walletType: 'normal',
      config: testNetConfig,
      walletName: 'My-TestNet-Wallet',
    };
    const testNetWallet = new WalletCreator(createOptions).create().wallet;

    expect(testNetWallet.name).to.eq('My-TestNet-Wallet');
    expect(testNetWallet.config).to.eq(testNetConfig);
    expect(testNetWallet.config.network.chainId).to.eq('testnet-croeseid-2');

    expect(testNetWallet.address.startsWith('tcro')).to.eq(true);
    expect(testNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(testNetWallet.identifier.length).to.eq(16);

    const { assets } = new WalletCreator(createOptions).create();

    expect(assets.length).to.eq(2);
    expect(
      assets
        .filter(asset => asset.assetType === UserAssetType.TENDERMINT)[0]
        .address?.startsWith('tcro'),
    ).to.eq(true);

    expect(
      assets.filter(asset => asset.assetType === UserAssetType.EVM)[0].address?.startsWith('0x'),
    ).to.eq(true);

    expect(assets.filter(asset => asset.assetType === UserAssetType.EVM)[0].decimals).to.eq(18);
  });

  it('Test creating a new wallet with main-net configuration', () => {
    const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

    const createOptions: WalletCreateOptions = {
      addressIndex: 0,
      walletType: 'normal',
      config: mainNetConfig,
      walletName: 'My-MainNet-Wallet',
    };
    const mainNetWallet = new WalletCreator(createOptions).create().wallet;

    expect(mainNetWallet.name).to.eq('My-MainNet-Wallet');
    expect(mainNetWallet.config).to.eq(mainNetConfig);

    expect(mainNetWallet.address.startsWith('cro')).to.eq(true);
    expect(mainNetWallet.encryptedPhrase.length > 0).to.eq(true);
    expect(mainNetWallet.identifier.length).to.eq(16);
    expect(mainNetConfig.derivationPath).to.eq("m/44'/394'/0'/0/0");
  });

  it('Test creating wallet from custom configurations ', () => {
    const customConfig: WalletConfig = {
      explorer: {},
      explorerUrl: '',
      indexingUrl: '',
      enabled: false,
      derivationPath: "44'/245'/0'/0/0",
      name: 'Pystaport-Custom-Network',
      enableGeneralSettings: false,
      disableDefaultClientMemo: false,
      analyticsDisabled: false,
      fee: {
        gasLimit: '',
        networkFee: '',
      },
      network: {
        defaultNodeUrl: '',
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
        rpcUrl: '',
      },
      nodeUrl: '123.18.45.12:3400',
    };

    const createOptions: WalletCreateOptions = {
      addressIndex: 0,
      walletType: 'normal',
      config: customConfig,
      walletName: 'My-Custom-Config-Wallet',
    };
    const customWallet = new WalletCreator(createOptions).create().wallet;

    expect(customWallet.address.startsWith('pcro')).to.eq(true);
    expect(customWallet.config).to.eq(customConfig);
    expect(customWallet.config.network.chainId).to.eq('pystaportnet');
  });
});
