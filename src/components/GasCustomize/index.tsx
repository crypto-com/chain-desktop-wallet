import * as React from 'react';
import { useNativeAsset } from '../../hooks/useNativeAsset';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
import { GasStepSelectEthereum } from './Ethereum/GasSelect';
import GasConfigEVM from './EVM/GasConfig';
import GasConfigTendermint from './Tendermint/GasConfig';

interface IGasStepProps {
  asset: UserAsset;
  onChange?: (gasLimit: string, networkFee: string) => void;
}

const GasStepSelect = (props: IGasStepProps) => {
  const { asset, onChange } = props;

  const nativeAsset = useNativeAsset(asset);

  if (asset.assetType === UserAssetType.TENDERMINT || asset.assetType === UserAssetType.IBC) {
    return <GasConfigTendermint onChange={onChange} />;
  }

  if (asset.assetType === UserAssetType.EVM || asset.assetType === UserAssetType.CRC_20_TOKEN || asset.assetType === UserAssetType.ERC_20_TOKEN) {
    return <GasConfigEVM asset={nativeAsset} onChange={onChange} />;
  }

  // Ethereum has a special select slow/average/fast
  if (props.asset.assetType === UserAssetType.EVM && props.asset.mainnetSymbol === 'ETH' || props.asset.assetType === UserAssetType.ERC_20_TOKEN) {
    return <GasStepSelectEthereum {...props} asset={nativeAsset} />
  }

  return <React.Fragment />
};

export default GasStepSelect;
