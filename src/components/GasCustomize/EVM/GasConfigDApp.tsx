import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import numeral from 'numeral';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EVM_MINIMUM_GAS_LIMIT, EVM_MINIMUM_GAS_PRICE } from '../../../config/StaticConfig';
import { UserAsset } from '../../../models/UserAsset';
import { getNormalScaleAmount } from '../../../utils/NumberUtils';
import { useCustomGasModalEVMDApp } from './GasModalDApp';

const GasStep = (props: { isUsingCustomFee: boolean }) => {

  const [t] = useTranslation();
  if (props.isUsingCustomFee) {
    return <>
      <p style={{
        marginBottom: "0px",
      }}>{t('general.custom')}</p>
      <p style={{
        marginBottom: "0px",
        color: "#7B849B"
      }}>{`${t('estimate-time')}: 1~24 ${t('general.hours').toLowerCase()}`}</p>
    </>
  }

  return <>
    <p style={{
      marginBottom: "0px",
    }}>{t('general.walletType.normal')}</p>
    <p style={{
      marginBottom: "0px",
      color: "#7B849B"
    }}>{`${t('estimate-time')}: 6s`}</p>
  </>
}

const GasStepSelectEVMDApp = (props: {
  asset?: UserAsset,
  gasLimit: BigNumber,
  gasPrice: BigNumber,
  onChange?: (gasLimit: BigNumber, gasPrice: BigNumber) => void,
}) => {

  const { asset } = props;

  const [t] = useTranslation();
  const [gasPrice, setGasPrice] = useState(props.gasPrice);
  const [gasLimit, setGasLimit] = useState(props.gasLimit);
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false)

  const { show, dismiss } = useCustomGasModalEVMDApp(asset!, gasPrice, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newGasPrice: BigNumber, newGasLimit: BigNumber) => {

    if (newGasPrice.toString() !== EVM_MINIMUM_GAS_PRICE || newGasLimit.toString() !== EVM_MINIMUM_GAS_LIMIT) {
      setIsUsingCustomGas(true)
    } else {
      setIsUsingCustomGas(false);
    }

    const amount = numeral(getNormalScaleAmount(newGasPrice.times(newGasLimit).toString(), asset!)).format("0,0.0000");

    setReadableGasFee(`${amount} ${asset!.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(gasPrice, gasLimit);
  }, [gasPrice, gasLimit]);

  return <Form.Item label={
    <div style={{
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{ marginRight: 4 }}>
        {t('confirmation-speed')}
      </div>
      <Tooltip
        style={{ cursor: "pointer" }}
        title={t('sending-crypto-on-blockchain-requires-confirmation')}>
        <ExclamationCircleOutlined style={{ color: '#1199fa', cursor: "pointer" }} />
      </Tooltip>
    </div>}>
    <div style={{
      display: "flex",
      background: "#F7F7F7",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px",
    }}>
      <div style={{
        display: 'flex',
        flexDirection: "column",
        alignItems: 'flex-start',
      }}>
        <GasStep isUsingCustomFee={isUsingCustomGas} />
      </div>
      <p style={{
        marginBottom: "0px"
      }}>{readableGasFee}</p>
    </div>
    <a style={{ float: "right", marginTop: "4px" }} onClick={() => {
      show({
        onCancel: () => { },
        onSuccess: (_newGasLimit, _newGasFee) => {
          props.onChange?.(_newGasLimit, _newGasFee);
          dismiss();

          const newGasLimit = new BigNumber(_newGasLimit)
          const newGasPrice = new BigNumber(_newGasFee)

          setGasLimit(newGasLimit)
          setGasPrice(newGasPrice)
          updateFee(newGasPrice, newGasLimit);
        }
      })
    }}>{t('custom-options')}</a>
  </Form.Item>
}

export default GasStepSelectEVMDApp;
