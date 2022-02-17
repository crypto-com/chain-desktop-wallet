import { useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { walletAllAssetsState } from '../recoil/atom';
import { getCronosAsset } from '../utils/utils';

export const useCronosAsset = () => {
  const allAssets = useRecoilValue(walletAllAssetsState);

  const cronosAsset = useMemo(() => {
    return getCronosAsset(allAssets);
  }, [allAssets]);

  return cronosAsset;
};
