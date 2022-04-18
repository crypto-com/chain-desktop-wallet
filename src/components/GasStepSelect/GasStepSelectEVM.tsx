import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import { ethers } from 'ethers';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { EVM_MINIMUM_GAS_LIMIT, EVM_MINIMUM_GAS_PRICE } from '../../config/StaticConfig';
import { useCronosEvmAsset } from '../../hooks/useCronosEvmAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomGasModalEVM } from './CustomGasModalEVM';


const GasStepSelectEVM = (props: {
  onChange?: (gasLimit: number, gasPrice: number) => void,
}) => {

  const asset = useCronosEvmAsset();

  const [gasPrice, setGasPrice] = useState(asset?.config?.fee?.networkFee ?? EVM_MINIMUM_GAS_PRICE);
  const [gasLimit, setGasLimit] = useState(asset?.config?.fee?.gasLimit ?? EVM_MINIMUM_GAS_LIMIT);

  const { show, dismiss } = useCustomGasModalEVM(asset!, gasPrice, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newGasPrice: string, newGasLimit: string) => {


    const amountBigNumber = ethers.BigNumber.from(newGasLimit).mul(ethers.BigNumber.from(newGasPrice))

    const amount = getNormalScaleAmount(amountBigNumber.toString(), asset!)

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
        <p style={{
          marginBottom: "0px",
        }}>Standard</p>
        <p style={{
          marginBottom: "0px",
          color: "#7B849B"
        }}>Estimated time: 6s</p>
      </div>
      <p style={{
        marginBottom: "0px"
      }}>{readableGasFee}</p>
    </div>
    <a style={{ float: "right", marginTop: "4px" }} onClick={() => {
      show({
        onCancel: () => { },
        onSuccess: (newGasLimit, newGasFee) => {
          props.onChange?.(newGasLimit, newGasFee);
          dismiss();

          setGasLimit(newGasLimit.toString())
          setGasPrice(newGasFee.toString())
          updateFee(newGasFee.toString(), newGasLimit.toString());
        }
      })
    }}>Custom Options</a>
  </Form.Item>
}

export default GasStepSelectEVM;
