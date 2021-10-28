export interface AddressBookContact {
  id: string;
  label: string;
  address: string;
}

// for persistence
export interface AddressBookContactModel {
  walletId: string;
  asset: string;
  label: string;
  address: string;
}
