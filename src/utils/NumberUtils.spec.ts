import 'mocha';
import { expect } from 'chai';
import {
  adjustedTransactionAmount,
  fromScientificNotation,
  getBaseScaledAmount,
  getNormalScaleAmount,
  getUIDynamicAmount,
  getUINormalScaleAmount,
} from './NumberUtils';
import { UserAsset } from '../models/UserAsset';
import { DefaultWalletConfigs } from '../config/StaticConfig';

describe('Testing Number utils', () => {
  it('Test floating point precision ', () => {
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
      unbondingBalance: '0',
      rewardsBalance: '0',
    };

    expect(getBaseScaledAmount('0.00000003', asset)).to.eq('3');
    expect(getBaseScaledAmount('0.0000000299', asset)).to.eq('2.99');

    expect(getNormalScaleAmount('5000', asset)).to.eq('0.00005');
    expect(getNormalScaleAmount('524005000', asset)).to.eq('5.24005');

    expect(getUINormalScaleAmount('2458999245545', asset.decimals)).to.eq('24589.9924');
    expect(getUINormalScaleAmount('334005045600', asset.decimals)).to.eq('3340.0504');

    expect(getUINormalScaleAmount('499995000', asset.decimals)).to.eq('4.9999');

    expect(getUINormalScaleAmount('499995000', asset.decimals, 8)).to.eq('4.99995000');
    expect(getUINormalScaleAmount('334005045600', asset.decimals, 8)).to.eq('3340.05045600');
  });

  it('Test Dynamic amount display', () => {
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
      unbondingBalance: '0',
      rewardsBalance: '0',
    };

    expect(getUIDynamicAmount('499995000', asset)).to.eq('4.9999');
    expect(getUIDynamicAmount('334005045600', asset)).to.eq('3340.0504');

    expect(getUIDynamicAmount('49999501', asset)).to.eq('0.49999501');
    expect(getUIDynamicAmount('50456031', asset)).to.eq('0.50456031');
  });

  it('Test conversion from scientific notation', () => {
    expect(fromScientificNotation('3E-4')).to.eq('0.0003');
    expect(fromScientificNotation('42E-4')).to.eq('0.0042');
    expect(fromScientificNotation('1440')).to.eq('1440');

    expect(fromScientificNotation('1e-8')).to.eq('0.00000001');
    expect(fromScientificNotation('3e-8')).to.eq('0.00000003');
  });

  it('Test adjusting transaction amount when exceeds balance', () => {
    const asset: UserAsset = {
      decimals: 8,
      mainnetSymbol: '',
      balance: '24500400',
      description: 'The best asset',
      icon_url: 'some url',
      identifier: 'cbd4bab2cbfd2b3',
      name: 'Best Asset',
      symbol: 'BEST',
      walletId: '',
      stakedBalance: '0',
      unbondingBalance: '0',
      rewardsBalance: '0',
    };

    const { networkFee } = DefaultWalletConfigs.TestNetConfig.fee;

    expect(adjustedTransactionAmount('0.245', asset, networkFee)).to.eq('0.2449');
    expect(adjustedTransactionAmount('0.1223', asset, networkFee)).to.eq('0.1223');
  });
});
