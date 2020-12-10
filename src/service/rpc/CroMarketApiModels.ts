export interface CroPrice {
  coin: CroCoinPrice;
}

export interface CroCoinPrice {
  symbol: string;
  price_native: CroCoinPriceNative;
  percent_change_native_24h: string;
}

export interface CroCoinPriceNative {
  currency: string;
  amount: string;
}
