import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AssetMarketPrice } from '../../models/UserAsset';
import {
  MARKET_API_BASE_URL,
  COINBASE_TICKER_API_BASE_URL,
  CRYPTO_COM_PRICE_API_BASE_URL,
} from '../../config/StaticConfig';
import {
  CoinbaseResponse,
  CryptoComSlugResponse,
  CryptoTokenPriceAPIResponse,
} from './models/marketApi.models';
import { CRC20MainnetTokenInfos } from '../../config/CRC20Tokens';

export interface IMarketApi {
  getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice>;
}

export class CroMarketApi implements IMarketApi {
  private readonly axiosClient: AxiosInstance;

  private readonly coinbaseRateBaseUrl: string;

  private tokenSlugMap: undefined | null | CryptoComSlugResponse[] = null;

  constructor() {
    this.axiosClient = axios.create({
      baseURL: MARKET_API_BASE_URL,
    });
    this.coinbaseRateBaseUrl = COINBASE_TICKER_API_BASE_URL;

    this.loadTokenSlugMap().then(slugMap => {
      this.tokenSlugMap = slugMap;
    });
  }

  public async getAssetPrice(assetSymbol: string, currency: string): Promise<AssetMarketPrice> {
    let fiatPrice = '';

    try {
      fiatPrice = await this.getTokenPriceFromCryptoCom(assetSymbol, currency);
    } catch (e) {
      return {
        assetSymbol,
        currency,
        dailyChange: '',
        price: '',
      };
    }

    return {
      assetSymbol,
      currency,
      dailyChange: '',
      price: fiatPrice,
    };
  }

  public async getCryptoToFiatRateFromCoinbase(cryptoSymbol: string, fiatCurrency: string) {
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
    const whitelistedCRC20Tokens: string[] = Array.from( CRC20MainnetTokenInfos.keys() );
    const allTokensSlugMap: CryptoComSlugResponse[] = await this.loadTokenSlugMap();

    const tokenSlugInfo = allTokensSlugMap.filter(tokenSlug => tokenSlug.symbol === cryptoSymbol);

    if (!tokenSlugInfo) {
      throw Error(`Couldn't find a valid slug name for ${cryptoSymbol}`);
    }

    const tokenPriceResponses: AxiosResponse<CryptoTokenPriceAPIResponse>[] = [];

    await Promise.all(
      tokenSlugInfo.map(async slugInfo => {
        const tokenPrice: AxiosResponse<CryptoTokenPriceAPIResponse> = await axios({
          baseURL: CRYPTO_COM_PRICE_API_BASE_URL.V1,
          url: `/tokens/${slugInfo?.slug}`,
        });
        tokenPriceResponses.push(tokenPrice);
      }),
    );

    // Filter Cronos / whitelisted token price only
    const tokenPriceInUSD = tokenPriceResponses.find(token =>
      token.data.tags.includes('cronos-ecosystem') || whitelistedCRC20Tokens.includes(token.data.symbol)
    );

    if (!tokenPriceInUSD) {
      throw Error(`Couldn't find a valid slug name for ${cryptoSymbol}`);
    }

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

  private async loadTokenSlugMap() {
    if (!this.tokenSlugMap || this.tokenSlugMap.length === 0) {
      const allTokensSlugMap: AxiosResponse<CryptoComSlugResponse[]> = await axios({
        baseURL: CRYPTO_COM_PRICE_API_BASE_URL.V2,
        url: '/all-tokens',
      });

      if (allTokensSlugMap.status !== 200 || allTokensSlugMap.data.length < 1) {
        throw Error('Could not fetch Token Slug list.');
      }

      this.tokenSlugMap = allTokensSlugMap.data;
    }
    return this.tokenSlugMap;
  }

  private async getFiatToFiatRate(fromFiatSymbol: string, toFiatSymbol: string) {
    return await this.getCryptoToFiatRateFromCoinbase(fromFiatSymbol, toFiatSymbol);
  }
}

export const croMarketPriceApi = new CroMarketApi();
