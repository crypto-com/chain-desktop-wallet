import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Select, Spin, Tooltip } from 'antd';
import { ethers } from 'ethers';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EVM_MINIMUM_GAS_LIMIT } from '../../config/StaticConfig';
import { useMarketPrice } from '../../hooks/useMarketPrice';
import { UserAsset } from "../../models/UserAsset"
import { EthereumGasStepInfo, getEthereumGasSteps } from '../../service/Gas';
import "./style.less";

const { Option } = Select;

interface IGasStepOption {
  title: string;
  wait: number;// minutes
  gasPrice: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
}

const GasStepOption = ({ title, wait, gasPrice, gasLimit }: IGasStepOption) => {
  const [t] = useTranslation();


  const readableGasFee = ethers.utils.formatEther(gasPrice.mul(gasLimit));
  const { readablePrice } = useMarketPrice({ symbol: 'WETH', amount: readableGasFee })

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 14px',
        // height: '80px',
        lineHeight: "30px",
        width: "100%"
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <p
          style={{
            marginBottom: '0px',
          }}
        >
          {title}
        </p>
        <p
          style={{
            marginBottom: '0px',
            color: '#7B849B',
          }}
        >{`${t('estimate-time')}: ${wait} ${t('general.minutes')}`}</p>
      </div>
      <div
        style={{
          marginBottom: '0px',
          textAlign: 'right'
        }}
      >
        <div>{readableGasFee} ETH</div>
        <div>{readablePrice}</div>
      </div>
    </div>
  );
};


interface IGasStepSelectEVMProps {
  asset: UserAsset
  onChange?: (gasLimit: string, gasPrice: string) => void
  gasLimit?: string
}

export const GasStepSelectEthereum = ({ asset, onChange, gasLimit }: IGasStepSelectEVMProps) => {

  const [gasInfo, setGasInfo] = useState<EthereumGasStepInfo | undefined>()
  const [isLoading, setIsLoading] = useState(false);

  const gasLimitInfo = useMemo(() => {
    if (!gasLimit) {
      return ethers.BigNumber.from(EVM_MINIMUM_GAS_LIMIT);
    }

    return ethers.BigNumber.from(gasLimit);
  }, [gasLimit])

  const [t] = useTranslation();

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const info = await getEthereumGasSteps()
      setGasInfo(info);
      setIsLoading(false)
    }

    fetch();
  }, [])

  console.log(asset, onChange, gasInfo);

  if (!gasInfo) {
    return <Spin style={{ left: 'auto' }} />
  }

  return <div style={{ width: "100%", marginBottom: "10px" }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px'
      }}
    >
      <div style={{ marginRight: 4 }}>{t('confirmation-speed')}</div>
      <Tooltip
        style={{ cursor: 'pointer' }}
        title={t('sending-crypto-on-blockchain-requires-confirmation')}
      >
        <ExclamationCircleOutlined style={{ color: '#1199fa', cursor: 'pointer' }} />
      </Tooltip>
    </div>
    <Select loading={isLoading} style={{ width: "100%" }} defaultValue="average" className=''>
      <Option value="slow"><GasStepOption title='Slow' wait={gasInfo.safeLowWait} gasPrice={gasInfo.safeLow} gasLimit={gasLimitInfo} /></Option>
      <Option value="average" ><GasStepOption title='Average' wait={gasInfo.averageWait} gasPrice={gasInfo.average} gasLimit={gasLimitInfo} /></Option>
      <Option value="fast"><GasStepOption title='Fast' wait={gasInfo.fastWait} gasPrice={gasInfo.fast} gasLimit={gasLimitInfo} /></Option>
    </Select>
  </div>
}
