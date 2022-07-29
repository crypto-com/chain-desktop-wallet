import React, { useState, useEffect, useCallback, useRef } from 'react';

import '../assets.less';
import '../chartarea.less';

import { Radio, Card, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useRecoilValue } from 'recoil';
import LineChart, { Dimensions, TokenData } from '../../../components/Charts/LineChart'
import { sessionState } from '../../../recoil/atom';
import { croMarketPriceApi } from '../../../service/rpc/MarketApi';
import { UserAsset } from '../../../models/UserAsset';

interface Props {
  asset: UserAsset;
}

export const ChartArea = ({ asset }:Props) => {
  const headers = ["datetime", "price"];
  const session = useRecoilValue(sessionState);
  const container = useRef<HTMLDivElement>(null);

  const [loadingData, setLoadingData] = useState(false);
  const [tokenPriceData, setTokenPriceData] = useState<TokenData[]>([]);
  const [duration, setDuration] = useState('d');
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 400, margin: {left:40, right: 40, top: 40, bottom: 40} });

  const getContainerSize = () => {
    if (!container?.current) {
      return;
    }

    const newWidth = container.current.clientWidth;
    setDimensions({...dimensions, width: newWidth - 40 * 2})
  }

  useEffect(() => {
    getContainerSize();
    window.addEventListener("resize", getContainerSize);
    return () => window.removeEventListener("resize", getContainerSize);
  }, []);
  
  const fetchTokenPrices = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await croMarketPriceApi.getTokenPrices(asset.symbol, session.currency, duration);
  
      const mappedTokenData: TokenData[] = data.prices?.map((elem) => {
        return {
          datetime: new Date(elem[0] * 1000),
          price: elem[1],
          marketCapacity: elem[2]
        };
      })
      setTokenPriceData(mappedTokenData);
    } finally {
      setLoadingData(false)
    }
  }, [asset, session.currency, duration]);


  useEffect(() => {
    fetchTokenPrices();
    console.log('tokenPriceData ', tokenPriceData, dimensions, asset.symbol, session.currency);
  }, [duration]);

  return (
    <Card
      ref={container}
    >
      <Spin
        spinning={loadingData}
        indicator={<LoadingOutlined />}
        tip="Calculating..."
      >
        <Radio.Group className="duration-changer" onChange={(e) => {
          setDuration(e.target.value)
        }} defaultValue={duration}>
          <Radio.Button value="h">1H</Radio.Button>
          <Radio.Button value="d">1D</Radio.Button>
          <Radio.Button value="w">1W</Radio.Button>
          <Radio.Button value="m">1M</Radio.Button>
          <Radio.Button value="3m">3M</Radio.Button>
          <Radio.Button value="6m">6M</Radio.Button>
        </Radio.Group>
        <LineChart
          data={tokenPriceData}
          dimensions={dimensions}
          headers={headers}
        />
      </Spin>
    </Card>
  )
};