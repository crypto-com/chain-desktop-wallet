import { ethers } from 'ethers';
import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useMarketPrice } from '../../../../hooks/useMarketPrice';
import { CronosClient } from '../../../../service/cronos/CronosClient';
import { getUINormalScaleAmount } from '../../../../utils/NumberUtils';
import { TokenDataWithApproval } from './types';

const SpenderMapping = new Map<string, string>();

const isUnlimited = (amount: ethers.BigNumber) => {
  return amount.gte(ethers.BigNumber.from('0xffffffffffffffffffffffffffffffff'))
}

export const TokenBalance = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;

  const amount = getUINormalScaleAmount(data.token.balance, data.token.decimals);
  const { readablePrice } = useMarketPrice({ symbol: data.token.symbol, amount })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <a target='__blank' href={`https://cronoscan.com/token/${data.token.contract.address}`}>{data.token.symbol}</a>
      <div>
        <span>{`${amount} ${data.token.symbol}  `}</span>
        <span style={{ color: '#A0A9BE' }}>({readablePrice})</span>
      </div>
    </div>
  );
};

export const Amount = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;
  return (
    <div>
      {
        isUnlimited(data.approval.amount) ? `Unlimited ${data.token.symbol}`
          : `${getUINormalScaleAmount(data.approval.amount.toString(), data.token.decimals)} ${data.token.symbol}`}
    </div>
  );
};

export const RiskExposure = (props: { data: TokenDataWithApproval }) => {
  const { data } = props;
  const amount = getUINormalScaleAmount(data.approval.amount.toString(), data.token.decimals);
  const balanceAmount = getUINormalScaleAmount(data.token.balance, data.token.decimals);
  const { readablePrice: totalBalancePrice } = useMarketPrice({ symbol: data.token.symbol, amount: balanceAmount })
  const { readablePrice } = useMarketPrice({ symbol: data.token.symbol, amount })

  return <div>{isUnlimited(data.approval.amount) ? totalBalancePrice : readablePrice}</div>;
};

export const TokenSpender = (props: { nodeURL: string; indexingURL: string; spender: string }) => {
  const { spender } = props;
  const [name, setName] = useState(spender);

  const fetch = useCallback(async () => {
    if (SpenderMapping.has(spender)) {
      setName(SpenderMapping.get(spender) ?? spender);
      return;
    }

    const cronosClient = new CronosClient(props.nodeURL, props.indexingURL);
    const response = await cronosClient.getContractSourceCodeByAddress(props.spender);

    let contractName = spender;
    if (response.result.length > 0) {
      contractName = response.result[0].ContractName;
      SpenderMapping.set(spender, contractName);
    }

    setName(contractName);
  }, [props.nodeURL, props.indexingURL, props.spender]);


  useEffect(() => {
    fetch();
  }, [fetch]);

  return <a href={`https://cronoscan.com/address/${spender}`} target="__blank">{name}</a>;
};
