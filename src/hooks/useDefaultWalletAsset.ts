import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { UserAsset } from '../models/UserAsset';
import { sessionState } from '../recoil/atom';
import { walletService } from '../service/WalletService';

export function useDefaultWalletAsset() {
  const currentSession = useRecoilValue(sessionState);
  const [defaultAsset, setDefaultAsset] = useState<UserAsset>();

  useEffect(() => {
    const syncAssetData = async () => {
      const currentWalletAsset = await walletService.retrieveDefaultWalletAsset(currentSession);
      setDefaultAsset(currentWalletAsset);
    };

    syncAssetData();
  }, [currentSession]);

  return { defaultAsset };
}
