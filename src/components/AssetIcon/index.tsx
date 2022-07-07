import React from 'react';
import { Avatar } from 'antd';
import { UserAsset, UserAssetType } from '../../models/UserAsset';
// import { getErc20IconUrlByContractAddress } from '../../utils/ERC20IconUrl';

// because of we will persist the user asset in the database,
// we don't want the icons urls change based on bundle system,
// so treat the icons as static assets
export const ICON_CRO_TENDERMINT = './assets/icon-cronos-tendermint.svg';
export const ICON_CRO_EVM = './assets/icon-cronos-evm.svg';
export const ICON_ATOM_TENDERMINT = './assets/icon-atom-tendermint.svg';
export const ICON_BRIDGE_CRYPTO_ORG = './assets/icon-bridge-crypto-org.svg';
export const ICON_BRIDGE_CRONOS = './assets/icon-bridge-cronos.svg';
export const ICON_BRIDGE_COSMOSHUB = './assets/icon-atom-tendermint.svg';

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
  if (asset.mainnetSymbol === 'ATOM') {
    return <img src={ICON_ATOM_TENDERMINT} alt="atom" className="asset-icon" />;
  }
  // if (asset.assetType === UserAssetType.ERC_20_TOKEN) {
  //   return <img src={getErc20IconUrlByContractAddress(asset.contractAddress!)} alt={asset.symbol || "erc20"} className="asset-icon" />;
  // }

  return icon_url ? (
    <img src={icon_url} alt={name} className="asset-icon" />
  ) : (
    <Avatar>{symbol[0].toUpperCase()}</Avatar>
  );
};

export const BridgeIcon = (props: { bridgeValue: string | undefined }) => {
  const { bridgeValue } = props;
  let icon = ICON_BRIDGE_CRYPTO_ORG;

  switch (bridgeValue) {
    case 'CRYPTO_ORG':
      icon = ICON_BRIDGE_CRYPTO_ORG;
      break;
    case 'CRONOS':
      icon = ICON_BRIDGE_CRONOS;
      break;
    case 'COSMOS_HUB':
      icon = ICON_BRIDGE_COSMOSHUB;
      break;
    default:
      break;
  }

  return <img src={icon} alt={bridgeValue} className="asset-icon" />;
};
