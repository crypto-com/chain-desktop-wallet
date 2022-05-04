import { useMemo } from 'react';
import { getRecoil } from 'recoil-nexus';
import { walletAllAssetsState } from '../recoil/atom';
import { getCronosEvmAsset, getCronosTendermintAsset } from '../utils/utils';

export const useCronosEvmAsset = () => {
  const allAssets = getRecoil(walletAllAssetsState);

  const cronosEvmAsset = useMemo(() => {
    return getCronosEvmAsset(allAssets);
  }, [allAssets]);

  return cronosEvmAsset;
};

export const useCronosTendermintAsset = () => {
  const allAssets = getRecoil(walletAllAssetsState);

  const cronosTendermintAsset = useMemo(() => {
    return getCronosTendermintAsset(allAssets);
  }, [allAssets]);

  return cronosTendermintAsset;
};
