import { UserAssetType } from './UserAsset';

export interface AddressBookContact {
  id: string;
  chainName: string;
  assetSymbol: string;
  label: string;
  address: string;
}

// for persistence
export interface AddressBookContactModel {
  walletId: string;
  chainName: string;
  assetSymbol: string;
  label: string;
  address: string;
}

interface AddressBookNetwork {
  value: string;
  label: string;
  networkType: UserAssetType;
}

const SupportedNetworksMap = new Map<string, AddressBookNetwork>();

SupportedNetworksMap.set('CRONOS', {
  value: 'CRONOS',
  label: 'Cronos Chain',
  networkType: UserAssetType.EVM,
});
SupportedNetworksMap.set('CRYPTO_ORG', {
  value: 'CRYPTO_ORG',
  label: 'Crypto.org Chain',
  networkType: UserAssetType.TENDERMINT,
});

const SupportedNetworks = Array.from(SupportedNetworksMap.values());

const getNetworkLabelWithValue = (value: string) => {
  const network = SupportedNetworksMap.get(value);
  if (!network) {
    return 'unknown';
  }

  return network.label;
};

export { SupportedNetworks, getNetworkLabelWithValue };
