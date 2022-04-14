import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { walletAllAssetsState } from '../recoil/atom';
import { getCronosEvmAsset, getCronosTendermintAsset } from '../utils/utils';

export const useCronosEvmAsset = () => {
  const allAssets = useRecoilValue(walletAllAssetsState);

  const cronosEvmAsset = useMemo(() => {
    return getCronosEvmAsset(allAssets);
  }, [allAssets]);

  return cronosEvmAsset;
};

export const useCronosTendermintAsset = () => {
  const allAssets = useRecoilValue(walletAllAssetsState);

  const cronosTendermintAsset = useMemo(() => {
    return getCronosTendermintAsset(allAssets);
  }, [allAssets]);

  return cronosTendermintAsset;
};
