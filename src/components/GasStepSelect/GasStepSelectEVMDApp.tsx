import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import BigNumber from 'bignumber.js';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { EVM_MINIMUM_GAS_LIMIT, EVM_MINIMUM_GAS_PRICE } from '../../config/StaticConfig';
import { UserAsset } from '../../models/UserAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomGasModalEVMDApp } from './CustomGasModalEVMDApp';

const GasStep = (props: { isUsingCustomFee: boolean }) => {
  if (props.isUsingCustomFee) {
    return <>
      <p style={{
        marginBottom: "0px",
      }}>Custom</p>
      <p style={{
        marginBottom: "0px",
        color: "#7B849B"
      }}>Estimated time: ~1~24 hours</p>
    </>
  }

  return <>
    <p style={{
      marginBottom: "0px",
    }}>Standard</p>
    <p style={{
      marginBottom: "0px",
      color: "#7B849B"
    }}>Estimated time: 6s</p>
  </>
}

const GasStepSelectEVMDApp = (props: {
  asset?: UserAsset,
  gasLimit: BigNumber,
  gasPrice: BigNumber,
  onChange?: (gasLimit: BigNumber, gasPrice: BigNumber) => void,
}) => {

  const { asset } = props;

  const [gasPrice, setGasPrice] = useState(props.gasPrice);
  const [gasLimit, setGasLimit] = useState(props.gasLimit);
  const [isUsingCustomGas, setIsUsingCustomGas] = useState(false)

  const { show, dismiss } = useCustomGasModalEVMDApp(asset!, gasPrice, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newGasPrice: BigNumber, newGasLimit: BigNumber) => {

    if (newGasPrice.toString() !== EVM_MINIMUM_GAS_PRICE || newGasLimit.toString() !== EVM_MINIMUM_GAS_LIMIT) {
      setIsUsingCustomGas(true)
    }

    const amount = getNormalScaleAmount(newGasPrice.times(newGasLimit).toString(), asset!)

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
        Confirmation Speed
      </div>
      <Tooltip title="Sending crypto on blockchain requires confirmation by the token network. When applicable, the higher the network fees, the more likely your transaction will be confirmed in a shorter period of time.">
        <ExclamationCircleOutlined style={{ color: '#1199fa' }} />
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
    }}>Custom Options</a>
  </Form.Item>
}

export default GasStepSelectEVMDApp;
