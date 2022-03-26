import 'mocha';
import * as fc from 'fast-check';
import { DefaultWalletConfigs } from '../../config/StaticConfig';
import sdk from '@crypto-org-chain/chain-jslib';
import { Units } from '../../utils/ChainJsLib';
import { assert } from 'console';

test('should declare coin in ledger correctly', () => {
  fc.assert(
    // both inclusive
    fc.property(fc.bigInt(BigInt('1'), BigInt('10000000000000000000')), coinAmount => {
      const cro = sdk.CroSDK({ network: DefaultWalletConfigs.TestNetConfig.network });
      const fee = new cro.Coin(coinAmount.toString(), Units.BASE);
      assert(fee.toString() === coinAmount.toString());
      return true;
    }),
    { verbose: true },
  );
});
