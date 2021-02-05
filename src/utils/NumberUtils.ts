import { UserAsset } from '../models/UserAsset';
import { Big } from './ChainJsLib';

export function fromScientificNotation(value) {
  return Big(value).toFixed();
}

// E.g : 1 CRO = 10^8 BASECRO
// eslint-disable-next-line class-methods-use-this
export function getBaseScaledAmount(amount: string, asset: UserAsset): string {
  const exp = Big(10).pow(asset.decimals);
  return Big(amount)
    .times(exp)
    .toFixed();
}
/// E.G : From 5000 BASETRCRO to 0.00005 TCRO
export function getNormalScaleAmount(amount: string, asset: UserAsset): string {
  const exp = Big(10).pow(asset.decimals);
  return Big(amount)
    .div(exp)
    .toFixed();
}

/// Get normal scale amount but fixed to 4 decimals
export function getUINormalScaleAmount(amount: string, decimals: number): string {
  const exp = Big(10).pow(decimals);
  return Big(amount)
    .div(exp)
    .toFixed(4);
}
