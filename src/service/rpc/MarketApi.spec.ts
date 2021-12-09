import 'mocha';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { expect } from 'chai';
import { croMarketPriceApi } from './MarketApi';
import { allTokensSlug, croToFiatRateStub, ethToFiatRateStub, usdToFiatConversionRate, vvsFinancePrice } from './test/mock.marketapi';

describe('MarketApi', () => {
  let axiosMock: MockAdapter;

  beforeEach(() => {
    axiosMock = new MockAdapter(axios, { onNoMatch: 'throwException' });
  });

  afterEach(() => {
    axiosMock.reset();
  });
  it('should return the `ETH` fiat rate ', async () => {
    axiosMock
      .onGet('/exchange-rates', {
        params: {
          currency: 'ETH'
        },
      })
      .replyOnce(200, ethToFiatRateStub);

    const ethToFiatRate = await croMarketPriceApi.getAssetPrice('ETH', 'SGD');
    expect(ethToFiatRate.assetSymbol).to.equal('ETH');
    expect(ethToFiatRate.currency).to.equal('SGD');
    expect(ethToFiatRate.dailyChange).to.deep.equal('');
    expect(ethToFiatRate.price).to.deep.equal('4604.13319145');

  });
  it('should return the `CRO` fiat rate ', async () => {
    axiosMock
      .onGet('/exchange-rates', {
        params: {
          currency: 'CRO'
        },
      })
      .replyOnce(200, croToFiatRateStub);

    const croToFiatRate = await croMarketPriceApi.getAssetPrice('CRO', 'SGD');
    expect(croToFiatRate.assetSymbol).to.equal('CRO');
    expect(croToFiatRate.currency).to.equal('SGD');
    expect(croToFiatRate.dailyChange).to.deep.equal('');
    expect(croToFiatRate.price).to.deep.equal('4604.13319145');

  });
  it('should throw on legacy `CRO` and `USD` rate ', async () => {

    axiosMock
      .onGet()
      .replyOnce(200, croToFiatRateStub);

    const croToFiatRate = await croMarketPriceApi.getAssetPrice('CRO', 'USD');
    expect(croToFiatRate.assetSymbol).to.equal('CRO');
    expect(croToFiatRate.currency).to.equal('USD');
    expect(croToFiatRate.dailyChange).to.eq('');
    expect(croToFiatRate.price).to.eq('3427.505');

  });

  it('should return token price from Crypto.com Price API', async () => {

    axiosMock
      .onGet('/all-tokens')
      .replyOnce(200, allTokensSlug)
      .onGet('/all-tokens')
      .replyOnce(200, allTokensSlug);

    axiosMock
      .onGet('/tokens/vvs-finance')
      .replyOnce(200, vvsFinancePrice)
      .onGet('/tokens/vvs-finance')
      .replyOnce(200, vvsFinancePrice);

    axiosMock
      .onGet('/exchange-rates', {
        params: {
          currency: 'USD'
        },
      })
      .replyOnce(200, usdToFiatConversionRate);

    const vvsTokenPriceSGD = await croMarketPriceApi.getTokenPriceFromCryptoCom('VVS', 'SGD');
    expect(vvsTokenPriceSGD).to.equals('0.00060383095694892');

    const vvsTokenPriceUSD = await croMarketPriceApi.getTokenPriceFromCryptoCom('VVS', 'USD');
    expect(vvsTokenPriceUSD).to.equals('0.000442751368');
  })

});
