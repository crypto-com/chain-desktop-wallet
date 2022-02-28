import React from 'react';
import { Avatar } from 'antd';
import { UserAsset, UserAssetType } from '../../models/UserAsset';

// because of we will persist the user asset in the database,
// we don't want the icons urls change based on bundle system,
// so treat the icons as static assets
export const ICON_CRO_TENDERMINT = './assets/icon-cro.svg';
export const ICON_CRO_EVM = './assets/icon-cronos-blue.svg';

export const AssetIcon = (props: { asset: UserAsset }) => {
  const { asset } = props;
  const { name, icon_url, symbol } = asset;

  if (asset.mainnetSymbol === 'CRO') {
    if (asset.assetType === UserAssetType.TENDERMINT) {
      return <img src={ICON_CRO_TENDERMINT} alt="cronos" className="asset-icon" />;
    }
    if (asset.assetType === UserAssetType.EVM) {
      return <img src={ICON_CRO_EVM} alt="cronos" className="asset-icon" />;
    }
  }

  return icon_url ? (
    <img src={icon_url} alt={name} className="asset-icon" />
  ) : (
    <Avatar>{symbol[0].toUpperCase()}</Avatar>
  );
};

export const BridgeIcon = (props: { bridgeValue: string | undefined }) => {
  const { bridgeValue } = props;
  let icon = ICON_CRO_TENDERMINT;

  switch (bridgeValue) {
    case 'CRYPTO_ORG':
      icon = ICON_CRO_TENDERMINT;
      break;
    case 'CRONOS':
      icon = ICON_CRO_EVM;
      break;
    default:
      break;
  }

  return <img src={icon} alt={bridgeValue} className="asset-icon" />;
};
