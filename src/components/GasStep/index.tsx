import { Radio } from 'antd';
import * as React from 'react';
import { getGasFee, useCROGasStep } from '../../hooks/useCROGasStep';
import { UserAsset } from '../../models/UserAsset';
import { CROGasStep } from '../../utils/localStorage';

interface IGasStepProps {
  asset: UserAsset;
}

const GasStep = (props: IGasStepProps) => {
  const { asset } = props;

  const { gasStep, updateGasStep } = useCROGasStep(asset)

  return <div>
    <Radio.Group defaultValue={gasStep} buttonStyle="solid" onChange={(e) => {
      updateGasStep(e.target.value)
    }}>
      <Radio.Button value="low">Low {getGasFee('low', asset)}</Radio.Button>
      <Radio.Button value="average">Average {getGasFee('average', asset)} </Radio.Button>
      <Radio.Button value="high">High {getGasFee('high', asset)}</Radio.Button>
    </Radio.Group>
  </div>
}

export default GasStep;
