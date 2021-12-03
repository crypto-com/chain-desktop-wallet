import { UserAssetType } from './UserAsset';
import { SupportedChainName } from '../config/StaticConfig';

export interface AddressBookContact {
  id: string;
  chainName: string;
  assetSymbol: string;
  label: string;
  address: string;
  memo: string;
}

// for persistence
export interface AddressBookContactModel {
  walletId: string;
  chainName: string;
  assetSymbol: string;
  label: string;
  address: string;
  memo: string;
}

interface AddressBookNetwork {
  label: string;
  networkType: UserAssetType;
}

const SupportedNetworks: AddressBookNetwork[] = [
  {
    label: SupportedChainName.CRONOS,
    networkType: UserAssetType.EVM,
  },
  {
    label: SupportedChainName.CRYPTO_ORG,
    networkType: UserAssetType.TENDERMINT,
  },
];

export { SupportedNetworks };
