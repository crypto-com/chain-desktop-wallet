import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { LedgerConnectedApp, ledgerIsConnectedState } from '../recoil/atom';

interface Props {
  asset: UserAsset | undefined;
}

export const useLedgerStatus = (props: Props) => {
  const { asset } = props;

  const ledgerConnectedApp = useRecoilValue(ledgerIsConnectedState);
  const [isLedgerConnected, setIsLedgerConnected] = useState<boolean>();

  useEffect(() => {
    const checkIsLedgerConnected = () => {
      if (asset?.assetType === UserAssetType.TENDERMINT || asset?.assetType === UserAssetType.IBC) {
        setIsLedgerConnected(ledgerConnectedApp === LedgerConnectedApp.CRYPTO_ORG);
      } else if (
        asset?.assetType === UserAssetType.EVM ||
        asset?.assetType === UserAssetType.CRC_20_TOKEN ||
        asset?.assetType === UserAssetType.ERC_20_TOKEN
      ) {
        setIsLedgerConnected(ledgerConnectedApp === LedgerConnectedApp.ETHEREUM);
      } else {
        setIsLedgerConnected(false);
      }
    };

    checkIsLedgerConnected();
  }, [ledgerConnectedApp]);

  return { isLedgerConnected };
};
