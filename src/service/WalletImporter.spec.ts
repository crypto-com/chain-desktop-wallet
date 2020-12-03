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
});
