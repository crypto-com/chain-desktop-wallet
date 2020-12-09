import { CroNetwork } from '@crypto-com/chain-jslib/lib/dist/core/cro';

export type WalletConfig = {
  name: string;
  nodeUrl: string;
  derivationPath: string;
  network: Network;
};

const TestNetConfig: WalletConfig = {
  name: 'TESTNET',
  derivationPath: "m/44'/1'/0'/0/0",
  nodeUrl: 'https://testnet-croeseid-1.crypto.com:26657',
  network: CroNetwork.Testnet,
};

const MainNetConfig: WalletConfig = {
  name: 'MAINNET',
  derivationPath: "44'/394'/0'/0/0",
  nodeUrl: 'TO_BE_DECIDED',
  network: CroNetwork.Mainnet,
};

// Available wallet configs will be presented to the user on wallet creation
// The user can either select default configs available or simply configure their own configuration from scratch
export const DefaultWalletConfigs = {
  TestNetConfig,
  MainNetConfig,
};

// This type is a copy of the Network type defined inside chain-js
// The redefinition is a work-around on limitation to lib to export it
export type Network = {
  chainId: string;
  addressPrefix: string;
  bip44Path: { coinType: number; account: number };
  validatorPubKeyPrefix: string;
  validatorAddressPrefix: string;
  coin: { baseDenom: string; croDenom: string };
};
