import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../config/StaticConfig';
import { useCronosTendermintAsset } from '../../hooks/useCronosEvmAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomGasModalTendermint } from './CustomGasModalTendermint';


export const GasInfoTendermint = () => {

  const asset = useCronosTendermintAsset()
  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newNetworkFee: string) => {

    const amount = getNormalScaleAmount(newNetworkFee, asset!)

    setReadableGasFee(`${amount} ${asset!.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  }, [asset]);

  return <>
    <div className="item">
      <div className="label">Estimated Network Fee</div>
      <div>{readableGasFee}</div>
    </div>
    <div className='item'>

      <div className="label">Estimated Time</div>
      <div>6s</div>
    </div>
  </>
}

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


const GasStepSelectTendermint = (props: {
  onChange?: (gasLimit: number, networkFee: number) => void,
}) => {

  const { onChange } = props;

  const asset = useCronosTendermintAsset()

  const [networkFee, setNetworkFee] = useState(asset!.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  const [gasLimit, setGasLimit] = useState(asset!.config?.fee?.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT);

  const [isUsingCustomFee, setIsUsingCustomFee] = useState(false);
  const { show, dismiss } = useCustomGasModalTendermint(asset!, networkFee, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newNetworkFee: string) => {
    setIsUsingCustomFee(newNetworkFee !== FIXED_DEFAULT_FEE);
    const amount = getNormalScaleAmount(newNetworkFee, asset!)

    setReadableGasFee(`${amount} ${asset!.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  }, [asset]);

  return <Form.Item label={
    <div style={{
      display: 'flex',
      alignItems: 'center',
      marginTop: '10px'
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
        <GasStep isUsingCustomFee={isUsingCustomFee} />
      </div>
      <p style={{
        marginBottom: "0px"
      }}>{readableGasFee}</p>
    </div>
    <a style={{ float: "right", marginTop: "4px" }} onClick={() => {
      show({
        onCancel: () => { },
        onSuccess: (newGasLimit, newGasFee) => {
          onChange?.(newGasLimit, newGasFee);
          dismiss();

          setGasLimit(newGasLimit.toString())
          setNetworkFee(newGasFee.toString())
          updateFee(newGasFee.toString());
        }
      })
    }}>Custom Options</a>
  </Form.Item>
}

export default GasStepSelectTendermint;
