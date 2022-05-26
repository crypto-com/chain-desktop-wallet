import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Select, Spin, Tooltip } from 'antd';
import { ethers } from 'ethers';
import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getRecoil } from 'recoil-nexus';
import { EVM_MINIMUM_GAS_LIMIT, EVM_MINIMUM_GAS_PRICE } from '../../../config/StaticConfig';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useMarketPrice } from '../../../hooks/useMarketPrice';
import { UserAsset } from '../../../models/UserAsset';
import { sessionState } from '../../../recoil/atom';
import { EthereumGasStepInfo, getEthereumGasSteps } from '../../../service/Gas';
import GasConfigEVM from '../EVM/GasConfig';
import { useCustomGasModalEVM } from '../EVM/GasModal';
import '../style.less';
import { updateGasInfo } from '../utils';

const { Option } = Select;

interface IGasStepOption {
  title: string;
  wait?: number; // minutes
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
        >
          {!wait
            ? `${t('estimate-time')}: ~1~24 ${t('general.hours').toLowerCase()}`
            : `${t('estimate-time')}: ${wait} ${t('general.minutes')}`}
        </p>
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

interface IGasStepSelectEthereumProps {
  asset: UserAsset;
  onChange?: (gasLimit: string, gasPrice: string) => void;
}

export const GasStepSelectEthereum = ({ asset, onChange }: IGasStepSelectEthereumProps) => {
  const [gasInfo, setGasInfo] = useState<EthereumGasStepInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [gasPrice, setGasPrice] = useState(asset?.config?.fee?.networkFee ?? EVM_MINIMUM_GAS_PRICE);
  const [gasLimit, setGasLimit] = useState(asset?.config?.fee?.gasLimit ?? EVM_MINIMUM_GAS_LIMIT);
  const { show, dismiss } = useCustomGasModalEVM(asset, gasPrice, gasLimit);
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false);
  const [t] = useTranslation();
  const currentSession = getRecoil(sessionState);
  const { analyticsService } = useAnalytics();
  const [hasFetchError, setHasFetchedError] = useState(false);

  const gasLimitInfo = useMemo(() => {
    if (!gasLimit) {
      return ethers.BigNumber.from(EVM_MINIMUM_GAS_LIMIT);
    }

    return ethers.BigNumber.from(gasLimit);
  }, [gasLimit]);

  useEffect(() => {
    const fetch = async () => {
      setHasFetchedError(false);
      setIsLoading(true);
      const info = await getEthereumGasSteps();
      setGasInfo(info);
      if (info) {
        setGasPrice(info.average.toString());
        updateFee(info.average.toString(), gasLimit);
      } else {
        setHasFetchedError(true);
      }
      setIsLoading(false);
    } 

    fetch();
  }, []);

  const updateFee = async (newGasPrice: string, newGasLimit: string) => {
    if (!gasInfo) {
      return;
    }
    const defaultGasPrices = [
      gasInfo.safeLow.toString(),
      gasInfo.average.toString(),
      gasInfo.fast.toString(),
    ];
    if (!defaultGasPrices.includes(newGasPrice) || newGasLimit !== EVM_MINIMUM_GAS_LIMIT) {
      setIsUsingCustomGas(true);
    } else {
      setIsUsingCustomGas(false);
    }

    await updateGasInfo(currentSession, asset, newGasLimit, newGasPrice, analyticsService);
  };

  // fall back to general EVM gas config
  if (hasFetchError) {
    return <GasConfigEVM asset={asset} onChange={onChange} />
  }

  if (!gasInfo || isLoading) {
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
      {isUsingCustomGas ? (
        <Select
          open={false}
          id="customGasFeeSelect"
          value="custom"
          style={{ width: '100%' }}
          className="gasStepSelectEthereumCustom"
          allowClear
          onClear={() => {
            const defaultGasPrice = gasInfo.average.toString();
            setGasPrice(defaultGasPrice);
            setGasLimit(EVM_MINIMUM_GAS_LIMIT);
            updateFee(defaultGasPrice, EVM_MINIMUM_GAS_LIMIT);
          }}
        >
          <Option value="custom">
            <GasStepOption
              title="Custom"
              gasPrice={ethers.BigNumber.from(gasPrice)}
              gasLimit={ethers.BigNumber.from(gasLimit)}
            />
          </Option>
        </Select>
      ) : (
        <Select
          loading={isLoading}
          style={{ width: '100%' }}
          defaultValue={gasInfo.average.toString()}
          value={gasPrice}
          className="gasStepSelectEthereum"
          onChange={async (value) => {
            setGasPrice(value);
            await updateFee(value, gasLimit);
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
      )}
      <a
        style={{ float: 'right', marginTop: '4px' }}
        onClick={() => {
          show({
            onCancel: () => { },
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
