export interface UserAsset {
  identifier: string;

  symbol: string;

  name: string;

  balance: string;

  walletId: string;

  icon_url: string;

  description: string;
}

export interface AssetPrice {
  price: string;

  currency: string;

  assetSymbol: string;

  dailyChange: string;
}
