import numeral from 'numeral';
import { useMemo } from 'react';
import { getRecoil } from 'recoil-nexus';
import { SUPPORTED_CURRENCY } from '../config/StaticConfig';
import { getAssetAmountInFiat, UserAssetType } from '../models/UserAsset';
import { allMarketState, sessionState } from '../recoil/atom';

interface Props {
  assetType: UserAssetType;
  symbol: string;
  amount: string;
}
export const useMarketPrice = ({ assetType, symbol, amount }: Props) => {
  const allMarketData = getRecoil(allMarketState);
  const currentSession = getRecoil(sessionState);

  const assetMarketData = allMarketData.get(`${assetType}-${symbol}-${currentSession.currency}`);

  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';

  const readablePrice = useMemo(() => {
    let price = '--';

    if (assetMarketData) {
      price = numeral(getAssetAmountInFiat(amount, assetMarketData)).format('0,0.00');
    }

    return `${localFiatSymbol}${price}`;
  }, [amount, assetMarketData, localFiatSymbol]);

  return { readablePrice };
};
