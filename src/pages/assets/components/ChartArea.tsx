import React, { useState, useEffect } from 'react';

import '../assets.less';
import '../chartarea.less';

import moment from 'moment';
import { Radio, Card, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useRecoilState, useRecoilValue } from 'recoil';

import LineChart from '../../../components/Charts/LineChart'
import { walletAssetState, sessionState } from '../../../recoil/atom';
import { croMarketPriceApi } from '../../../service/rpc/MarketApi';





export const ChartArea = () => {
    const headers = ["datetime", "price"];
    const [userAsset, setUserAsset] = useRecoilState(walletAssetState);
    const session = useRecoilValue(sessionState);

    const [loadingData, setLoadingData] = useState(false);
    const [tokenPriceData, setTokenPriceData] = useState<number[]>([]);
    const [tokenSymbol, setTokenSymbol] = useState((userAsset?.symbol !== "TCRO") ? userAsset?.symbol : "BTC" );
    const [fiatCurrency, setFiatCurrency] = useState(session?.currency);
    const [duration, setDuration] = useState('h');
    const [dimensions, setDimensions] = useState({"width": "100%", "height":"500", "margin":"42"});

    const updateDuration = ev => {
        setLoadingData(true);
        const { value } = ev.target;
        console.log('updateDuration ' , value);
        setDuration(value);
        setTimeout(tokenPrices, 500);
        setTimeout(() => {
            setLoadingData(false);
        }, 500);
    };


    const tokenPrices = async () => {
        setLoadingData(true);
        const callTokenPrices = await croMarketPriceApi.getTokenPrices(tokenSymbol,fiatCurrency,duration);


        console.log('getTokenPrices ', tokenSymbol, fiatCurrency, duration, callTokenPrices);

        if(callTokenPrices && callTokenPrices.data && callTokenPrices.data.prices && callTokenPrices.data.prices.length > 0){
            const mappedTokenData = callTokenPrices?.data?.prices?.map((elem) => {
                return {
                    datetime: moment(elem[0]).format("DD/MM/YYYY - HH:mm"),
                    price: elem[1],
                    "market capacity": elem[2]
                };
            })
            
    
        
            console.log('mappedTokenData ', mappedTokenData);
            setTokenPriceData(mappedTokenData);
            setTimeout(() => {
                setLoadingData(false);
            }, 500);
        }
      
    };
    

    useEffect(() => {
        tokenPrices();
        setDimensions({"width": "100%", "height":"500", "margin":"42"});
        
        setDuration('8H');
        
        console.log('tokenPriceData ', tokenPriceData, dimensions, userAsset?.symbol, session?.currency);

        setUserAsset(userAsset);
        setTokenSymbol((userAsset?.symbol !== "TCRO") ? userAsset?.symbol : "BTC" );
        setFiatCurrency(session?.currency);

    }, [tokenPriceData, setTokenPriceData]);

    return (
        <Card
        title=""
        >

            <Spin
              spinning={loadingData}
              indicator={<LoadingOutlined />}
              tip="Calculating..."
            >

            <Radio.Group className="duration-changer" onChange={updateDuration} defaultValue="8H">
                <Radio.Button value="h">1H</Radio.Button>
                <Radio.Button value="8h">8H</Radio.Button>
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