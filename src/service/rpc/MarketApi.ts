import axios, { AxiosInstance } from 'axios';
import { AssetMarketPrice } from '../../models/UserAsset';
import { CroCoinPrice } from './CroMarketApiModels';

export interface IMarketApi {
  getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice>;
}

export class CroMarketApi implements IMarketApi {
  private readonly axiosClient: AxiosInstance;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: 'https://chain.crypto.com/api',
      timeout: 10_000,
    });
  }

  public async getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice> {
    const croMarketPrice = await this.axiosClient.get<CroCoinPrice>('/coins/show');
    const loadedSymbol = croMarketPrice.data.symbol;
    const loadedCurrency = croMarketPrice.data.price_native.currency;

    if (assetSymbol.toUpperCase() !== loadedSymbol || loadedCurrency !== currency.toUpperCase()) {
      throw TypeError('Could not find requested market price info');
    }

    return {
      assetSymbol: loadedSymbol,
      currency: loadedCurrency,
      dailyChange: croMarketPrice.data.percent_change_native_24h,
      price: croMarketPrice.data.price_native.amount,
    };
  }
}

export const croMarketPriceApi = new CroMarketApi();
