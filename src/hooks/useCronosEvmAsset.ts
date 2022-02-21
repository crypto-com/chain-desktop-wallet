import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { walletAllAssetsState } from '../recoil/atom';
import { getCronosEvmAsset } from '../utils/utils';

export const useCronosEvmAsset = () => {
  const allAssets = useRecoilValue(walletAllAssetsState);

  const cronosEvmAsset = useMemo(() => {
    return getCronosEvmAsset(allAssets);
  }, [allAssets]);

  return cronosEvmAsset;
};
