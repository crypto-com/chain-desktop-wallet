import { UserAsset } from '../models/UserAsset';
import { Big } from './ChainJsLib';

export function fromScientificNotation(value) {
  return Big(value).toFixed();
}

// E.g : 1 CRO = 10^8 BASECRO
// eslint-disable-next-line class-methods-use-this
export function getBaseScaledAmount(amount: string, asset: UserAsset): string {
  const exp = Big(10).pow(asset.decimals);
  return String(Big(amount).times(exp));
}
