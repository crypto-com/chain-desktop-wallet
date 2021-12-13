export interface CoinbaseResponse {
    data: CoinbaseRateResponse;
}

export interface CoinbaseRateResponse {
    currency: string;
    rates: { [key: string]: string };
}

export interface CryptoComSlugResponse {
    symbol: string;
    slug: string;
    name: string;
    rank: number;
}

export interface CryptoTokenPriceAPIResponse {
    id: number;
    name: string;
    symbol: string;
    slug: string;
    active: boolean;
    prices: number[];
    tags: string[];
    circulating_supply: number;
    total_supply: number;
    max_supply: number;
    btc_price: number;
    btc_marketcap: number;
    btc_volume_24h: number;
    usd_price: number;
    usd_price_change_24h: number;
    btc_price_change_24h: number;
    usd_marketcap: number;
    usd_volume_24h: number;
    token_dominance_rate: number;
    rank: number;
    app_tradable: boolean;
    exchange_tradable: boolean;
    defi_tradable: boolean;
    restricted_areas: any[];
    usd_price_change_24h_abs: number;
    update_time: number;
    platform: null;
}
