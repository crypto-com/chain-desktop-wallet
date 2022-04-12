import Big from 'big.js';
import { getUINormalScaleAmount } from '../utils/NumberUtils';

// Need for asset level configuration since every asset now needs to know
// Its own nodeUrl, indexingUrl, etc,....
export interface UserAssetConfig {
  nodeUrl: string;
  indexingUrl: string;
  explorer: any;
  explorerUrl: string;
  chainId: string;
  fee: {
    gasLimit: string;
    networkFee: string;
  };
  isLedgerSupportDisabled: boolean;
  isStakingDisabled: boolean;

  // Some assets don't have support for memo
  memoSupportDisabled?: boolean;
}

export interface UserAsset {
  identifier: string;

  symbol: string;

  // This is to be used solely for markets data since testnet market prices is always non existent
  // That's why for all testnet assets a mainnet symbol is needed to help fetch market prices
  // NOTE : Consider this property as the asset ticket symbol for market prices
  mainnetSymbol: string;

  name: string;

  balance: string;

  stakedBalance: string;

  unbondingBalance: string;

  rewardsBalance: string;

  walletId: string;

  icon_url: string;

  description: string;

  // Specify the 10^decimals conversion to go from BASE TO ASSET
  // E.g = 1 TCRO = 1O^8 BASETCRO
  decimals: number;

  denomTracePath?: string;

  ibcDenomHash?: string;

  assetType?: UserAssetType;

  assetCreationType?: AssetCreationType;

  address?: string;

  config?: UserAssetConfig;

  // This field is used to differentiate default asset and secondary assets,
  // The original default asset have false or undefined on this field
  isSecondaryAsset?: boolean;

  // CRC20/ERC20 assets should have a contract address persisted along side them.
  // This will be used later for all actions interacting with the token like tokens transfers, etc, ...
  contractAddress?: string;

  isWhitelisted?: boolean;
}

export enum UserAssetType {
  // For Cosmos based assets
  TENDERMINT = 'TENDERMINT',
  // For Cosmos IBC assets
  IBC = 'IBC',

  // For EVM based assets like CRONOS
  EVM = 'EVM',

  // A token on the Cro EVM chain
  CRC_20_TOKEN = 'CRC_20_TOKEN',

  ERC_20_TOKEN = 'ERC_20_TOKEN',
}

export enum AssetCreationType {
  // Assets that are created statically on wallets creation
  STATIC = 'STATIC',

  // These assets are dynamically created - For instance IBC assets, token assets, etc, ...
  DYNAMIC = 'DYNAMIC',
}

export interface AssetMarketPrice {
  price: string;

  currency: string;

  assetSymbol: string;

  dailyChange: string;
}

export const scaledAmount = (baseAmount: string = '0', decimals: number) => {
  return getUINormalScaleAmount(baseAmount, decimals);
};

export const scaledAmountByAsset = (baseAmount: string = '0', asset: UserAsset) => {
  return getUINormalScaleAmount(baseAmount, asset.decimals);
};

export const scaledBalance = (asset: UserAsset) => {
  return getUINormalScaleAmount(asset.balance, asset.decimals);
};

export const scaledStakingBalance = (asset: UserAsset) => {
  return getUINormalScaleAmount(asset.stakedBalance, asset.decimals);
};

export const scaledUnbondingBalance = (asset: UserAsset) => {
  return getUINormalScaleAmount(asset.unbondingBalance, asset.decimals);
};

export const scaledRewardBalance = (asset: UserAsset) => {
  return getUINormalScaleAmount(asset.rewardsBalance, asset.decimals);
};

export const scaledTotalBalance = (asset: UserAsset) => {
  const totalBalance = Big(asset.balance || '0')
    .add(asset.stakedBalance || '0')
    .add(asset.unbondingBalance || '0')
    .add(asset.rewardsBalance || '0')
    .toFixed(2);
  return getUINormalScaleAmount(totalBalance, asset.decimals);
};

export const getAssetPriceIdFrom = (assetSymbol: string, currency: string) => {
  return `${assetSymbol}-${currency}`.toUpperCase();
};

export const getAssetPriceId = (assetPrice: AssetMarketPrice) => {
  return getAssetPriceIdFrom(assetPrice.assetSymbol, assetPrice.currency);
};

export const getAssetBalancePrice = (asset: UserAsset, marketPrice: AssetMarketPrice) => {
  if (!marketPrice.price) {
    return '--';
  }
  const bigAsset = new Big(scaledBalance(asset));
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};

export const getAssetTotalBalancePrice = (asset: UserAsset, marketPrice: AssetMarketPrice) => {
  const bigAsset = new Big(scaledTotalBalance(asset));
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};

export const getAssetAmountInFiat = (amount: string, marketPrice: AssetMarketPrice) => {
  if (!amount) {
    return '';
  }
  const bigAsset = new Big(amount);
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};

export const getAssetStakingBalancePrice = (asset: UserAsset, marketPrice: AssetMarketPrice) => {
  const bigAsset = new Big(scaledStakingBalance(asset));
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};

export const getAssetUnbondingBalancePrice = (asset: UserAsset, marketPrice: AssetMarketPrice) => {
  const bigAsset = new Big(scaledUnbondingBalance(asset));
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};

export const getAssetRewardsBalancePrice = (asset: UserAsset, marketPrice: AssetMarketPrice) => {
  const bigAsset = new Big(scaledRewardBalance(asset));
  const bigMarketPrice = new Big(marketPrice.price ? marketPrice.price : '0');
  return bigAsset.times(bigMarketPrice).toFixed(2);
};
