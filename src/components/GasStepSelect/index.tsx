import * as React from 'react';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import GasStepSelectEVM from './GasStepSelectEVM';
import GasStepSelectTendermint from './GasStepSelectTendermint';

interface IGasStepProps {
  asset: UserAsset;
  onChange?: (gasLimit: number, networkFee: number) => void;
}

const GasStepSelect = (props: IGasStepProps) => {
  const { asset, onChange } = props;


  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
    return <GasStepSelectTendermint asset={asset} onChange={onChange} />
  }

  if (asset.assetType === UserAssetType.EVM || asset.assetType === UserAssetType.CRC_20_TOKEN) {
    return <GasStepSelectEVM asset={asset} onChange={onChange} />
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
