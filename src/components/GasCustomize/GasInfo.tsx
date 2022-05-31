import * as React from 'react';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { GasInfoEVM } from './EVM/GasConfig';
import { GasInfoTendermint } from './Tendermint/GasConfig';
import { useNativeAsset } from '../../hooks/useNativeAsset';

interface GasInfoProps {
  asset: UserAsset,
}

const GasInfo = (props: GasInfoProps) => {
  const { asset } = props;

  const nativeAsset = useNativeAsset(asset);

  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
    return <GasInfoTendermint />
  }

  if (asset.assetType === UserAssetType.EVM || asset.assetType === UserAssetType.CRC_20_TOKEN) {
    return <GasInfoEVM asset={nativeAsset} />
  }

  return <React.Fragment />
}


export default GasInfo;
