import 'mocha';
import { AddressType } from '@crypto-org-chain/chain-jslib/lib/dist/utils/address';
import { AssetAddressValidator } from './AssetAddressValidator';
import { DefaultWalletConfigs } from '../config/StaticConfig';
import { UserAssetType } from '../models/UserAsset';

describe('Testing Asset Address Validation', () => {
  it('Test validating Cro Tendermint Address', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const addressValidator = new AssetAddressValidator(
      'tcro1nrztwwgrgjg4gtctgul80menh7p04n4vhmh5wj',
      testNetConfig,
      UserAssetType.TENDERMINT,
    );

    expect(addressValidator.validate(AddressType.USER)).toBe(true);

    const addressValidator2 = new AssetAddressValidator(
      'azz2tcro1nrztwwgrgjg4gtctgul80menh7p04n4vhmh5wj',
      testNetConfig,
      UserAssetType.TENDERMINT,
    );

    expect(addressValidator2.validate(AddressType.USER)).toBe(false);
  });

  it('Test validating Cronos EVM Address', () => {
    const testNetConfig = DefaultWalletConfigs.TestNetConfig;

    const addressValidator = new AssetAddressValidator(
      '0xD47286f025F947482a2C374Fb70e9D4c94d809CF',
      testNetConfig,
      UserAssetType.EVM,
    );

    expect(addressValidator.validate(AddressType.USER)).toBe(true);
  });
});
