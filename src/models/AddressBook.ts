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
  label: string;
  networkType: UserAssetType;
}

const SupportedNetworks: AddressBookNetwork[] = [
  {
    label: 'Cronos Chain',
    networkType: UserAssetType.EVM,
  },
  {
    label: 'Crypto.org Chain',
    networkType: UserAssetType.TENDERMINT,
  },
];

export { SupportedNetworks };
