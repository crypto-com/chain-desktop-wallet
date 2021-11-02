export interface AddressBookContact {
  id: string;
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
