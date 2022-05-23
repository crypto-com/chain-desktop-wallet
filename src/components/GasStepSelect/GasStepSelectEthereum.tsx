import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Select, Spin, Tooltip } from 'antd';
import { ethers } from 'ethers';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EVM_MINIMUM_GAS_LIMIT, EVM_MINIMUM_GAS_PRICE } from '../../config/StaticConfig';
import { useMarketPrice } from '../../hooks/useMarketPrice';
import { UserAsset } from '../../models/UserAsset';
import { EthereumGasStepInfo, getEthereumGasSteps } from '../../service/Gas';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomGasModalEVM } from './CustomGasModalEVM';
import './style.less';

const { Option } = Select;

interface IGasStepOption {
  title: string;
  wait: number; // minutes
  gasPrice: ethers.BigNumber;
  gasLimit: ethers.BigNumber;
}

const GasStepOption = ({ title, wait, gasPrice, gasLimit }: IGasStepOption) => {
  const [t] = useTranslation();

  const readableGasFee = ethers.utils.formatEther(gasPrice.mul(gasLimit));
  const { readablePrice } = useMarketPrice({ symbol: 'WETH', amount: readableGasFee });

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 14px',
        // height: '80px',
        lineHeight: '30px',
        width: '100%',
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
          textAlign: 'right',
        }}
      >
        <div>{readableGasFee} ETH</div>
        <div>{readablePrice}</div>
      </div>
    </div>
  );
};

interface IGasStepSelectEVMProps {
  asset: UserAsset;
  onChange?: (gasLimit: string, gasPrice: string) => void;
}

export const GasStepSelectEthereum = ({ asset, onChange }: IGasStepSelectEVMProps) => {
  const [gasInfo, setGasInfo] = useState<EthereumGasStepInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [gasPrice, setGasPrice] = useState(asset?.config?.fee?.networkFee ?? EVM_MINIMUM_GAS_PRICE);
  const [gasLimit, setGasLimit] = useState(asset?.config?.fee?.gasLimit ?? EVM_MINIMUM_GAS_LIMIT);
  const { show, dismiss } = useCustomGasModalEVM(asset, gasPrice, gasLimit);
  const [readableGasFee, setReadableGasFee] = useState('');
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false);
  const [t] = useTranslation();

  const gasLimitInfo = useMemo(() => {
    if (!gasLimit) {
      return ethers.BigNumber.from(EVM_MINIMUM_GAS_LIMIT);
    }

    return ethers.BigNumber.from(gasLimit);
  }, [gasLimit]);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      const info = await getEthereumGasSteps();
      setGasInfo(info);
      setIsLoading(false);
    };

    fetch();
  }, []);

  const updateFee = (newGasPrice: string, newGasLimit: string) => {
    if (newGasPrice !== EVM_MINIMUM_GAS_PRICE || newGasLimit !== EVM_MINIMUM_GAS_LIMIT) {
      setIsUsingCustomGas(true);
    } else {
      setIsUsingCustomGas(false);
    }

    const amountBigNumber = ethers.BigNumber.from(newGasLimit).mul(
      ethers.BigNumber.from(newGasPrice),
    );

    const amount = getNormalScaleAmount(amountBigNumber.toString(), asset!);

    setReadableGasFee(`${amount} ${asset.symbol}`);
  };

  if (!gasInfo) {
    return <Spin style={{ left: 'auto' }} />;
  }

  return (
    <div style={{ width: '100%', marginBottom: '30px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px',
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
      <Select
        loading={isLoading}
        style={{ width: '100%' }}
        defaultValue={gasInfo.average.toString()}
        className="gasStepSelectEthereum"
        onChange={value => {
          setGasPrice(value);
        }}
      >
        <Option value={gasInfo.safeLow.toString()}>
          <GasStepOption
            title="Slow"
            wait={gasInfo.safeLowWait}
            gasPrice={gasInfo.safeLow}
            gasLimit={gasLimitInfo}
          />
        </Option>
        <Option value={gasInfo.average.toString()}>
          <GasStepOption
            title="Average"
            wait={gasInfo.averageWait}
            gasPrice={gasInfo.average}
            gasLimit={gasLimitInfo}
          />
        </Option>
        <Option value={gasInfo.fast.toString()}>
          <GasStepOption
            title="Fast"
            wait={gasInfo.fastWait}
            gasPrice={gasInfo.fast}
            gasLimit={gasLimitInfo}
          />
        </Option>
      </Select>
      <a
        style={{ float: 'right', marginTop: '4px' }}
        onClick={() => {
          show({
            onCancel: () => {},
            onSuccess: (newGasLimit, newGasFee) => {
              onChange?.(newGasLimit, newGasFee);
              dismiss();

              setGasLimit(newGasLimit);
              setGasPrice(newGasFee);
              updateFee(newGasFee, newGasLimit);
            },
          });
        }}
      >
        {t('custom-options')}
      </a>
    </div>
  );
};
