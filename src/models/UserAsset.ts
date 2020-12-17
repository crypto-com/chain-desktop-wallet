export interface UserAsset {
  identifier: string;

  symbol: string;

  // This is to be used solely for markets data since testnet market prices is always non existent
  // That's why for all testnet assets a mainnet symbol is needed to help fetch market prices
  mainnetSymbol: string;

  name: string;

  balance: string;

  stakedBalance: string;

  walletId: string;

  icon_url: string;

  description: string;

  // Specify the 10^decimals conversion to go from BASE TO ASSET
  // E.g = 1 TCRO = 1O^8 BASETCRO
  decimals: number;
}

export interface AssetMarketPrice {
  price: string;

  currency: string;

  assetSymbol: string;

  dailyChange: string;
}

export const scaledBalance = (asset: UserAsset) => {
  const baseBalance = Number(asset.balance);
  if (baseBalance === 0) {
    return baseBalance;
  }
  // 1 CRO = 10^8 BASECRO
  return (baseBalance / 10 ** asset.decimals).toFixed(4);
};

export const getAssetPriceIdFrom = (assetSymbol: string, currency: string) => {
  return `${assetSymbol}-${currency}`.toUpperCase();
};

export const getAssetPriceId = (assetPrice: AssetMarketPrice) => {
  return getAssetPriceIdFrom(assetPrice.assetSymbol, assetPrice.currency);
};
