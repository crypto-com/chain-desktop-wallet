import _ from 'lodash';
import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { walletAllAssetsState } from '../recoil/atom';

export const useNativeAsset = (asset: UserAsset) => {
  const walletAllAssets = useRecoilValue(walletAllAssetsState);

  const nativeAssets = useMemo(() => {
    return walletAllAssets.filter(asset =>  _.size(asset.contractAddress) < 1);
  }, [walletAllAssets]);

  const nativeAsset = useMemo(() => {
    if (_.size(asset.contractAddress) < 1) {
      return nativeAssets.find(a => a.symbol === asset.symbol && a.assetType === asset.assetType);
    }

    if (asset.assetType === UserAssetType.CRC_20_TOKEN) {
      return nativeAssets.find(a => a.assetType === UserAssetType.EVM && a.mainnetSymbol === 'CRO' );
    }

    if (asset.assetType === UserAssetType.ERC_20_TOKEN) {
      return nativeAssets.find(a => a.assetType === UserAssetType.EVM && a.mainnetSymbol === 'ETH' );
    }

    return nativeAssets.find(a => a.assetType === UserAssetType.TENDERMINT && a.mainnetSymbol === 'CRO' );
  
  }, [nativeAssets, asset]);

  return nativeAsset!;
};
