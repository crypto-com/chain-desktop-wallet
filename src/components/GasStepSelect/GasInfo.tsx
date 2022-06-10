import * as React from 'react';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { GasInfoEVM } from './GasStepSelectEVM';
import { GasInfoTendermint } from './GasStepSelectTendermint';

interface GasInfoProps {
  asset: UserAsset;
}

const GasInfo = (props: GasInfoProps) => {
  const { asset } = props;

  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
    return <GasInfoTendermint />;
  }

  if (asset.assetType === UserAssetType.EVM || asset.assetType === UserAssetType.CRC_20_TOKEN) {
    return <GasInfoEVM />;
  }

  return <React.Fragment />;
};

export default GasInfo;
