import 'mocha';
import { expect } from 'chai';
import { walletService } from './WalletService';
import { UserAsset } from '../models/UserAsset';

describe('Testing WalletService', () => {
  const asset: UserAsset = {
    decimals: 8,
    mainnetSymbol: '',
    balance: '0',
    description: 'The best asset',
    icon_url: 'some url',
    identifier: 'cbd4bab2cbfd2b3',
    name: 'Best Asset',
    symbol: 'BEST',
    walletId: '',
    stakedBalance: '0',
  };

  it('Test floating point precision ', () => {
    expect(walletService.getBaseScaledAmount('0.00000003', asset)).to.eq('3');
    expect(walletService.getBaseScaledAmount('0.0000000299', asset)).to.eq('2.99');
  });
});
