export interface UserAsset {
  identifier: string;

  symbol: string;

  name: string;

  balance: string;

  stakedBalance: string;

  walletId: string;

  icon_url: string;

  description: string;
}

export interface AssetMarketPrice {
  price: string;

  currency: string;

  assetSymbol: string;

  dailyChange: string;
}

export const getAssetPriceIdFrom = (assetSymbol: string, currency: string) => {
  return `${assetSymbol}-${currency}`.toUpperCase();
};

export const getAssetPriceId = (assetPrice: AssetMarketPrice) => {
  return getAssetPriceIdFrom(assetPrice.assetSymbol, assetPrice.currency);
};
