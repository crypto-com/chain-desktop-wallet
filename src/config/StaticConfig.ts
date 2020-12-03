import { CroNetwork } from '@crypto-com/chain-jslib/lib/dist/core/cro';

export type WalletConfig = {
  name: string;
  chainId: string;
  nodeUrl: string;
  addressPrefix: string;
  coin: {
    baseDenom: string;
    croDenom: string;
  };
  derivationPath: string;
};

const TestNetConfig: WalletConfig = {
  name: 'TESTNET',
  derivationPath: "m/44'/1'/0'/0/0",
  nodeUrl: 'https://testnet-croeseid-1.crypto.com:26657',
  ...CroNetwork.Testnet,
};

const MainNetConfig: WalletConfig = {
  name: 'MAIN-NET',
  derivationPath: "44'/394'/0'/0/0",
  nodeUrl: 'TO_BE_DECIDED',
  ...CroNetwork.Mainnet,
};

// Available wallet configs will be presented to the user on wallet creation
// The user can either select default configs available or simply configure their own configuration from scratch
export const DefaultWalletConfigs = {
  TestNetConfig,
  MainNetConfig,
};
