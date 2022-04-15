import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Form, Radio, Select, Tooltip } from 'antd';
import * as React from 'react';
import { getGasFee, useCROGasStep } from '../../hooks/useCROGasStep';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { useCustomCROGasModal } from './CustomCROGasModal';

interface IGasStepProps {
  asset: UserAsset;
}

const GasStepSelect = (props: IGasStepProps) => {
  const { asset } = props;

  const { show } = useCustomCROGasModal(asset);

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
          }}>Estimated time: TODO</p>
        </div>
        <p style={{
          marginBottom: "0px"
        }}>0.0123CRO</p>
      </div>
      <a style={{ float: "right", marginTop: "4px" }} onClick={() => {
        show({
          onCancel: () => { },
          onSuccess: () => { }
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
