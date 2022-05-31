import { useEffect, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { UserAsset, UserAssetType } from '../models/UserAsset';
import { LedgerConnectedApp, ledgerIsConnectedState } from '../recoil/atom';

interface Props {
  assetType?: UserAssetType;
  asset?: UserAsset | undefined;
}

export const useLedgerStatus = (props: Props) => {
  // const { asset } = props;
  const assetType = props.assetType || props.asset?.assetType;

  const ledgerConnectedApp = useRecoilValue(ledgerIsConnectedState);
  const [isLedgerConnected, setIsLedgerConnected] = useState<boolean>();

  useEffect(() => {
    const checkIsLedgerConnected = () => {
      if (assetType === UserAssetType.TENDERMINT || assetType === UserAssetType.IBC) {
        setIsLedgerConnected(ledgerConnectedApp === LedgerConnectedApp.CRYPTO_ORG);
      } else if (
        assetType === UserAssetType.EVM ||
        assetType === UserAssetType.CRC_20_TOKEN ||
        assetType === UserAssetType.ERC_20_TOKEN
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
