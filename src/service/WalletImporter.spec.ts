import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs, WalletConfig } from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';
import { UserAssetType } from '../models/UserAsset';

describe('Testing WalletImporter', () => {
  it('Test importing wallet with testnet configuration', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const importOptions: WalletImportOptions = {
      addressIndex: 0,
      walletType: 'normal',
      config: testNetConfig,
      phrase:
        'ramp sock spice enrich exhibit skate empower process kit pudding olive mesh friend camp labor coconut devote shell argue system pig then provide nose',
      walletName: 'My-TestNet-Wallet',
    };
    const testNetWallet = new WalletImporter(importOptions).import().wallet;

    expect(testNetWallet.name).to.eq('My-TestNet-Wallet');
    expect(testNetWallet.address).to.eq('tcro15rsn69ze9r7g52tk0u6cyhu4edep88dxgtzm65');
    expect(testNetWallet.config).to.eq(testNetConfig);

    const { assets } = new WalletImporter(importOptions).import();

    expect(assets.length).to.eq(2);
    expect(
      assets
        .filter(asset => asset.assetType === UserAssetType.TENDERMINT)[0]
        .address?.startsWith('tcro'),
    ).to.eq(true);

    const evmCronosAsset = assets.filter(asset => asset.assetType === UserAssetType.EVM)[0];

    expect(evmCronosAsset.address?.startsWith('0x')).to.eq(true);
    expect(evmCronosAsset.decimals).to.eq(18);
    expect(evmCronosAsset?.address).to.eq('0x23806BC778F56AaA1e20CD0d1A44078aFa8D65b0');
  });

  it('Test importing wallet with main-net configuration', () => {
    const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

    const importOptions: WalletImportOptions = {
      addressIndex: 0,
      walletType: 'normal',
      config: mainNetConfig,
      phrase:
        'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone',
      walletName: 'My-MainNet-Wallet',
    };
    const testNetWallet = new WalletImporter(importOptions).import().wallet;

    expect(testNetWallet.name).to.eq('My-MainNet-Wallet');
    expect(testNetWallet.address).to.eq('cro1n0ejfh2ur2nslekrynvcwuwc9cccnhxfqn6sfs');
    expect(testNetWallet.config).to.eq(mainNetConfig);

    const { assets } = new WalletImporter(importOptions).import();

    const evmCronosAsset = assets.filter(asset => asset.assetType === UserAssetType.EVM)[0];
    expect(evmCronosAsset?.address).to.eq('0xc2aFcEC3DAfAF1a4f47030eE35Fd1A1231C08256');
  });

  it('Test importing wallet with custom configurations', () => {
    const customConfig: WalletConfig = {
      disableDefaultClientMemo: false,
      enableGeneralSettings: false,
      fee: { gasLimit: '', networkFee: '' },
      indexingUrl: '',
      explorer: {},
      explorerUrl: '',
      enabled: true,
      derivationPath: "44'/245'/0'/0/0",
      name: 'Pystaport-Custom-Network',
      analyticsDisabled: false,
      network: {
        defaultNodeUrl: '',
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
        rpcUrl: '',
      },
      nodeUrl: '123.18.45.12:3400',
    };

    const importOptions: WalletImportOptions = {
      addressIndex: 0,
      walletType: 'normal',
      phrase:
        'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone',
      config: customConfig,
      walletName: 'My-Custom-Config-Wallet',
    };
    const customWallet = new WalletImporter(importOptions).import().wallet;

    expect(customWallet.address).to.eq('pcro1fdu6qgn3r4ptsx8z6v5hr5dsjvkjw6jkyrphvx');
    expect(customWallet.config).to.eq(customConfig);
    expect(customWallet.config.network.chainId).to.eq('chainmaind');
  });
});
