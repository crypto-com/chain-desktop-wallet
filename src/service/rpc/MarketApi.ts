import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { AssetMarketPrice, UserAsset, UserAssetType } from '../../models/UserAsset';
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
import { ERC20MainnetTokenInfos } from '../../config/ERC20Tokens';

export interface IMarketApi {
  getAssetPrice(asset: UserAsset, currency: string): Promise<AssetMarketPrice>;
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

  public async getAssetPrice(asset: UserAsset, currency: string): Promise<AssetMarketPrice> {
    let fiatPrice = '';
    const { mainnetSymbol, assetType } = asset;

    try {
      fiatPrice = await this.getTokenPriceFromCryptoCom(asset, currency);
    } catch (e) {
      return {
        assetSymbol: mainnetSymbol,
        currency,
        dailyChange: '',
        price: '',
        assetType,
      };
    }

    return {
      assetSymbol: mainnetSymbol,
      currency,
      dailyChange: '',
      price: fiatPrice,
      assetType,
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

  public async getTokenPriceFromCryptoCom(asset: UserAsset, fiatCurrency: string) {
    const { assetType, mainnetSymbol } = asset;
    const whitelistedCRC20Tokens: string[] = Array.from(CRC20MainnetTokenInfos.keys());
    const whitelistedERC20Tokens: string[] = Array.from(ERC20MainnetTokenInfos.keys());
    const allTokensSlugMap: CryptoComSlugResponse[] = await this.loadTokenSlugMap();

    const nativeTokenSlug = ['crypto-com-coin', 'ethereum'];
    const tokenSlugInfo = allTokensSlugMap.filter(tokenSlug => tokenSlug.symbol === mainnetSymbol);

    if (!tokenSlugInfo) {
      throw Error(`Couldn't find a valid slug name for ${mainnetSymbol}`);
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

    // Filter supported native / whitelisted / Cronos / Ethereum token price only
    const tokenPriceInUSD = tokenPriceResponses.find(token => {
      // tags could be null
      token.data.tags = token.data.tags ?? [];
      return (
        nativeTokenSlug.includes(token.data.slug) ||
        (assetType === UserAssetType.CRC_20_TOKEN &&
          whitelistedCRC20Tokens.includes(token.data.symbol)) ||
        (assetType === UserAssetType.CRC_20_TOKEN &&
          token.data.tags.includes('cronos-ecosystem')) ||
        (assetType === UserAssetType.ERC_20_TOKEN &&
          whitelistedERC20Tokens.includes(`${token.data.symbol.toUpperCase()}`))
      );
    });

    if (!tokenPriceInUSD) {
      throw Error(`Couldn't find a valid slug name for ${mainnetSymbol}`);
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
