import React, { useState, useEffect, useCallback, useRef } from 'react';

import '../assets.less';
import '../chartarea.less';

import { Radio, Card, Spin, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useRecoilValue } from 'recoil';
import LineChart, { Dimensions, TokenData } from '../../../components/Charts/LineChart';
import { sessionState } from '../../../recoil/atom';
import { croMarketPriceApi } from '../../../service/rpc/MarketApi';
import { AssetMarketPrice, UserAsset } from '../../../models/UserAsset';
import { roundPrice } from '../../../utils/NumberUtils';
import { SUPPORTED_CURRENCY } from '../../../config/StaticConfig';

const Text = Typography.Text;

interface Props {
  asset: UserAsset;
  assetMarketData?: AssetMarketPrice;
}

const CHART_HEIGHT = 360;
const CHART_MARGIN = {
  left: 40,
  right: 40,
  top: 10,
  bottom: 40,
};

export const ChartArea = ({ asset, assetMarketData }: Props) => {
  const session = useRecoilValue(sessionState);
  const container = useRef<HTMLDivElement>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [tokenPriceData, setTokenPriceData] = useState<TokenData[]>([]);
  const [tokenPriceText, setTokenPriceText] = useState('');
  const [duration, setDuration] = useState('d');
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: CHART_HEIGHT,
    margin: CHART_MARGIN,
  });

  const currentTokenPriceText = assetMarketData?.price
    ? `${SUPPORTED_CURRENCY.get(session.currency)?.symbol}${roundPrice(parseFloat(assetMarketData?.price!))} ${session.currency}`
    : `${SUPPORTED_CURRENCY.get(session.currency)?.symbol}--`;

  const currentTokenDailyChange = parseFloat(assetMarketData?.dailyChange ?? '0') * 100;

  const getContainerSize = () => {
    if (!container?.current) {
      return;
    }

    const newWidth = container.current.clientWidth;
    setDimensions({ ...dimensions, width: newWidth - CHART_MARGIN.left - CHART_MARGIN.right });
  };

  useEffect(() => {
    getContainerSize();
    window.addEventListener('resize', getContainerSize);
    return () => window.removeEventListener('resize', getContainerSize);
  }, []);

  const fetchTokenPrices = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await croMarketPriceApi.getTokenPrices(
        asset,
        session.currency,
        duration,
      );

      const mappedTokenData: TokenData[] = data.prices?.map(elem => {
        return {
          datetime: new Date(elem[0] * 1000),
          price: elem[1],
          marketCapacity: elem[2],
        };
      });
      setTokenPriceData(mappedTokenData);
      if (assetMarketData) {
        setTokenPriceText(currentTokenPriceText);
      }
    } catch {
      setTokenPriceData([]);
    } finally {
      setLoadingData(false);
    }
  }, [asset, session.currency, duration]);

  useEffect(() => {
    fetchTokenPrices();
  }, [duration]);

  useEffect(() => {

  }, [tokenPriceText]);

  return (
    <Card ref={container}>
      <Spin spinning={loadingData} indicator={<LoadingOutlined />}>
        <div style={{ float: 'left', display: 'flex', alignItems: 'center' }}>
          <Text style={{ fontSize: '24px' }}>
            {tokenPriceText}
          </Text>
          <Text style={{ marginLeft: '5px', fontSize: '20px', color: currentTokenDailyChange > 0 ? '#00A68C' : '#D9475A' }}>
            {!isNaN(currentTokenDailyChange) ? `${currentTokenDailyChange > 0 ? '+' : ''}${currentTokenDailyChange.toPrecision(2)}%` : '--%'}
          </Text>
          <Text style={{ marginLeft: '5px', fontSize: '16px' }}>
            {'(24H)'}
          </Text>
        </div>
        <Radio.Group
          className="duration-changer"
          onChange={e => {
            setDuration(e.target.value);
          }}
          defaultValue={duration}
        >
          <Radio.Button value="h">1H</Radio.Button>
          <Radio.Button value="d">1D</Radio.Button>
          <Radio.Button value="w">1W</Radio.Button>
          <Radio.Button value="m">1M</Radio.Button>
          <Radio.Button value="3m">3M</Radio.Button>
          <Radio.Button value="6m">6M</Radio.Button>
        </Radio.Group>
        <LineChart data={tokenPriceData} dimensions={dimensions} />
      </Spin>
    </Card>
  );
};
