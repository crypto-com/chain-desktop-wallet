import { ethers } from 'ethers';
import numeral from 'numeral';
import * as React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { getRecoil } from 'recoil-nexus';
import { SUPPORTED_CURRENCY } from '../../../../config/StaticConfig';
import { getAssetAmountInFiat } from '../../../../models/UserAsset';
import { allMarketState, sessionState } from '../../../../recoil/atom';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import { getUINormalScaleAmount } from '../../../../utils/NumberUtils';
import { TokenDataWithApproval } from './types';

const SpenderMapping = new Map<string, string>();

export const TokenBalance = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;

  const allMarketData = getRecoil(allMarketState);
  const currentSession = getRecoil(sessionState);

  const assetMarketData = allMarketData.get(`${data.token.symbol}-${currentSession.currency}`);

  const amount = getUINormalScaleAmount(data.token.balance, data.token.decimals);
  const localFiatSymbol = SUPPORTED_CURRENCY.get(assetMarketData?.currency ?? 'USD')?.symbol ?? '';

  const readablePrice = useMemo(() => {
    let price = '--';

    if (assetMarketData) {
      price = numeral(getAssetAmountInFiat(amount, assetMarketData)).format('0,0.00');
    }

    return `${localFiatSymbol}${price}`;
  }, [amount, assetMarketData, localFiatSymbol]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div>{data.token.symbol}</div>
      <div>
        <span>{amount}</span>
        <span>{readablePrice}</span>
      </div>
    </div>
  );
};

export const Amount = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;
  return (
    <div>
      {data.approval.amount.gte(ethers.BigNumber.from('0xffffffffffffffffffffffffffffffff'))
        ? `Unlimited ${data.token.symbol}`
        : getUINormalScaleAmount(data.approval.amount.toString(), data.token.decimals)}
    </div>
  );
};

export const RiskExposure = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;
  return <div>{data.approval.riskExposure}</div>;
};

export const TokenSpender = (props: { nodeURL: string; indexingURL: string; spender: string }) => {
  const [name, setName] = useState('unknown');
  const { spender } = props;

  useEffect(() => {
    const fetch = async () => {
      if (SpenderMapping.has(spender)) {
        setName(SpenderMapping.get(spender) ?? '');
        return;
      }

      const cronosClient = new CronosClient(props.nodeURL, props.indexingURL);
      const response = await cronosClient.getContractSourceCodeByAddress(props.spender);

      let contractName = 'unknown';
      if (response.result.length > 0) {
        contractName = response.result[0].ContractName;
        SpenderMapping.set(spender, contractName);
      }

      setName(contractName);
    };

    fetch();
  }, [props.spender, props.indexingURL, props.nodeURL]);

  return <div>{name}</div>;
};
