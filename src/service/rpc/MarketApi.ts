import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AssetMarketPrice } from '../../models/UserAsset';
import { MARKET_API_BASE_URL, COINBASE_TICKER_API_BASE_URL } from '../../config/StaticConfig';

export interface IMarketApi {
  getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice>;
}

export interface cryptoToFiatRateResp {
  data: Data;
}

export interface Data {
  currency: string;
  rates: { [key: string]: string };
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
    const fiatRateResp: AxiosResponse<cryptoToFiatRateResp> = await axios({
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
}

export const croMarketPriceApi = new CroMarketApi();
