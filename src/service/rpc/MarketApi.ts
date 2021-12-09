import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AssetMarketPrice } from '../../models/UserAsset';
import { MARKET_API_BASE_URL, COINBASE_TICKER_API_BASE_URL, CRYPTO_COM_PRICE_API_BASE_URL } from '../../config/StaticConfig';
import { CoinbaseResponse, CryptoComSlugResponse, CryptoTokenPriceAPIResponse } from './models/marketApi.models';

export interface IMarketApi {
  getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice>;
}

export class CroMarketApi implements IMarketApi {
  private readonly axiosClient: AxiosInstance;

  private readonly coinbaseRateBaseUrl: string;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: MARKET_API_BASE_URL,
    });
    this.coinbaseRateBaseUrl = COINBASE_TICKER_API_BASE_URL;
  }

  public async getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice> {

    const fiatPrice = await this.getCryptoToFiatRateFromCoinbase(assetSymbol, currency);
    return {
      assetSymbol,
      currency,
      dailyChange: '',
      price: fiatPrice,
    };
  }

  private async getCryptoToFiatRateFromCoinbase(cryptoSymbol: string, fiatCurrency: string) {
    const fiatRateResp: AxiosResponse<CoinbaseResponse> = await axios({
      baseURL: this.coinbaseRateBaseUrl,
      url: '/exchange-rates',
      params: {
        currency: cryptoSymbol,
      },
    });

    if (fiatRateResp.status !== 200) {
      throw Error('Could not find requested market price info from Coinbase');
    }

    // Fetch Price from response
    if (
      fiatRateResp.data &&
      fiatRateResp.data.data.currency === cryptoSymbol &&
      typeof fiatRateResp.data.data.rates[fiatCurrency] !== 'undefined'
    ) {
      return fiatRateResp.data.data.rates[fiatCurrency];
    }

    // throw if no price found
    throw TypeError('Could not find requested market price info from Coinbase');
  }

  public async getTokenPriceFromCryptoCom(cryptoSymbol: string, fiatCurrency: string) {
    const allTokensSlugMap: AxiosResponse<CryptoComSlugResponse[]> = await axios({
      baseURL: CRYPTO_COM_PRICE_API_BASE_URL.V2,
      url: '/all-tokens',
    });

    if (allTokensSlugMap.status !== 200) {
      throw Error('Could not fetch Token Slug list.');
    }

    const tokenSlugInfo = allTokensSlugMap.data.find(tokenSlug => tokenSlug.symbol === cryptoSymbol);

    if (!tokenSlugInfo?.slug) {
      throw Error(`Couldn't find a valid slug name for ${cryptoSymbol}`);
    }

    const tokenPriceInUSD: AxiosResponse<CryptoTokenPriceAPIResponse> = await axios({
      baseURL: CRYPTO_COM_PRICE_API_BASE_URL.V1,
      url: `/tokens/${tokenSlugInfo?.slug}`,
    });

    if (tokenPriceInUSD.status !== 200) {
      throw Error('Could not fetch token price.');
    }

    let usdToFiatRate = '1';
    if (fiatCurrency !== 'USD') {
      usdToFiatRate = await this.getFiatToFiatRate('USD', fiatCurrency);
    }

    const tokenPriceInFiat = Number(tokenPriceInUSD.data.usd_price) * Number(usdToFiatRate);

    return String(tokenPriceInFiat);
  }

  private async getFiatToFiatRate(fromFiatSymbol: string, toFiatSymbol: string) {
    return await this.getCryptoToFiatRateFromCoinbase(fromFiatSymbol, toFiatSymbol);
  }
}

export const croMarketPriceApi = new CroMarketApi();
