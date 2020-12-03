import 'mocha';
import { expect } from 'chai';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { WalletImporter, WalletImportOptions } from './WalletImporter';

describe('Testing WalletImporter', () => {
  it('Test importing wallet with testnet configuration', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const importOptions: WalletImportOptions = {
      config: testNetConfig,
      phrase:
        'ramp sock spice enrich exhibit skate empower process kit pudding olive mesh friend camp labor coconut devote shell argue system pig then provide nose',
      walletName: 'My-TestNet-Wallet',
    };
    const testNetWallet = WalletImporter.import(importOptions);

    expect(testNetWallet.name).to.eq('My-TestNet-Wallet');
    expect(testNetWallet.address).to.eq('tcro15rsn69ze9r7g52tk0u6cyhu4edep88dxgtzm65');
    expect(testNetWallet.config).to.eq(testNetConfig);
  });

  it('Test importing wallet with main-net configuration', () => {
    const mainNetConfig = DefaultWalletConfigs.MainNetConfig;

    const importOptions: WalletImportOptions = {
      config: mainNetConfig,
      phrase:
        'team school reopen cave banner pass autumn march immune album hockey region baby critic insect armor pigeon owner number velvet romance flight blame tone',
      walletName: 'My-MainNet-Wallet',
    };
    const testNetWallet = WalletImporter.import(importOptions);

    expect(testNetWallet.name).to.eq('My-MainNet-Wallet');
    expect(testNetWallet.address).to.eq('cro1n0ejfh2ur2nslekrynvcwuwc9cccnhxfqn6sfs');
    expect(testNetWallet.config).to.eq(mainNetConfig);
  });
});
