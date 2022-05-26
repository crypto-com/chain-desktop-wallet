import * as React from 'react';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import GasStepSelectEVM from './EVM/GasSelect';
import GasStepSelectTendermint from './Tendermint/GasSelect';

interface IGasStepProps {
  asset: UserAsset;
  onChange?: (gasLimit: string, networkFee: string) => void;
}

const GasStepSelect = (props: IGasStepProps) => {
  const { asset, onChange } = props;

  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
    return <GasStepSelectTendermint onChange={onChange} />;
  }

  if (asset.assetType === UserAssetType.EVM || asset.assetType === UserAssetType.CRC_20_TOKEN || asset.assetType === UserAssetType.ERC_20_TOKEN) {
    return <GasStepSelectEVM asset={asset} onChange={onChange} />;
  }

  // const { gasStep, updateGasStep } = useCROGasStep(asset)

  return <React.Fragment />
};

export default GasStepSelect;
