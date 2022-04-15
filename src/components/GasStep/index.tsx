import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Form, Tooltip } from 'antd';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from '../../config/StaticConfig';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { getNormalScaleAmount } from '../../utils/NumberUtils';
import { useCustomCROGasModal } from './CustomCROGasModal';

interface IGasStepProps {
  asset: UserAsset;
  onChange?: () => void;
}

const GasStepSelect = (props: IGasStepProps) => {
  const { asset, onChange } = props;

  const [networkFee, setNetworkFee] = useState(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  const [gasLimit, setGasLimit] = useState(asset.config?.fee?.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT);

  const { show, dismiss } = useCustomCROGasModal(asset, networkFee, gasLimit);

  const [readableGasFee, setReadableGasFee] = useState('')

  const updateFee = (newNetworkFee: string) => {

    const amount = getNormalScaleAmount(newNetworkFee, asset)

    setReadableGasFee(`${amount} ${asset.symbol}`);
  }

  useEffect(() => {
    if (!asset) {
      return;
    }
    updateFee(asset.config?.fee?.networkFee ?? FIXED_DEFAULT_FEE);
  }, [asset]);

  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
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
            onChange?.()
            dismiss();

            setGasLimit(newGasLimit.toString())
            setNetworkFee(newGasFee.toString())
            updateFee(newGasFee.toString());
          }
        })
      }}>Custom Options</a>
    </Form.Item>
  }

  // const { gasStep, updateGasStep } = useCROGasStep(asset)

  return <div>

    {/* <Radio.Group defaultValue={gasStep} buttonStyle="solid" onChange={(e) => {
      updateGasStep(e.target.value)
    }}>
      <Radio.Button value="low">Low {getGasFee('low', asset)}</Radio.Button>
      <Radio.Button value="average">Average {getGasFee('average', asset)} </Radio.Button>
      <Radio.Button value="high">High {getGasFee('high', asset)}</Radio.Button>
    </Radio.Group> */}
  </div>
}

export default GasStepSelect;
