import { Big } from 'big.js';
import { scaledBalance, UserAsset } from '../models/UserAsset';
import { FIXED_DEFAULT_FEE } from '../config/StaticConfig';

// Here we are telling the library to NOT DO any rounding, either up or down
Big.RM = 0;

export function fromScientificNotation(value) {
  return Big(value).toFixed();
}

// E.g : 1 CRO = 10^8 BASECRO
// eslint-disable-next-line class-methods-use-this
export function getBaseScaledAmount(amount: string = '0', asset: UserAsset): string {
  const exp = Big(10).pow(asset.decimals);
  return Big(amount)
    .times(exp)
    .toFixed();
}

/// E.G : From 5000 BASETRCRO to 0.00005 TCRO
export function getNormalScaleAmount(amount: string = '0', asset: UserAsset): string {
  const exp = Big(10).pow(asset.decimals);
  return Big(amount)
    .div(exp)
    .toFixed();
}

/// Get normal scale amount but fixed to 4 decimals
export function getUINormalScaleAmount(
  amount: string = '0',
  decimals: number,
  decimalPoint?: number,
): string {
  const exp = Big(10).pow(decimals);
  const dp = decimalPoint || 4;
  return Big(amount || '0')
    .div(exp)
    .toFixed(dp);
}

// For very small transactions amounts => do show up to max decimal numbers
export function getUIDynamicAmount(amount: string = '0', currentAsset: UserAsset) {
  let finalAmount = getUINormalScaleAmount(amount, currentAsset.decimals, 4);
  if (Big(finalAmount).lte(Big(1))) {
    finalAmount = getUINormalScaleAmount(amount, currentAsset.decimals, 8);
  }
  return finalAmount;
}

export const formatLargeNumber = (n): string => {
  if (n < 1e3) return `${n}`;
  if (n >= 1e3 && n < 1e6) return `${+(n / 1e3).toFixed(1)}K`;
  if (n >= 1e6 && n < 1e9) return `${+(n / 1e6).toFixed(1)}M`;
  if (n >= 1e9 && n < 1e12) return `${+(n / 1e9).toFixed(1)}B`;
  if (n >= 1e12) return `${+(n / 1e12).toFixed(1)}T`;
  return ``;
};

export function getUIVoteAmount(amount: string = '0', asset: UserAsset) {
  const exp = Big(10).pow(asset.decimals);
  const voteAmount = Big(amount)
    .div(exp)
    .toNumber();

  return formatLargeNumber(voteAmount);
}

export function getCurrentMinAssetAmount(userAsset: UserAsset) {
  const exp = userAsset ? Big(10).pow(userAsset.decimals) : 1;
  return Big(1)
    .div(exp)
    .toNumber();
}

// When user selects option to send max amount,
// transaction fee gets deduced to the sent amount for the transaction to be successful
export function adjustedTransactionAmount(
  formAmount: string = '0',
  walletAsset: UserAsset,
  fee: string,
): string {
  // Handle case for existing users
  const currentFee = fee ?? FIXED_DEFAULT_FEE;
  // const availableBalance = Big('10000000000000000000000000');
  const availableBalance = Big(scaledBalance(walletAsset));
  const fixedFee = getNormalScaleAmount(currentFee, walletAsset);
  const amountAndFee = Big(formAmount).add(fixedFee);
  if (amountAndFee.gt(availableBalance)) {
    return availableBalance.minus(fixedFee).toFixed();
  }
  return formAmount.toString();
}
