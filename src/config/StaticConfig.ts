import { CroNetwork } from '@crypto-com/chain-jslib/lib/dist/core/cro';

export type WalletConfig = {
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
  derivationPath: "m/44'/1'/0'/0/0",
  nodeUrl: 'https://testnet-croeseid-1.crypto.com:26657',
  ...CroNetwork.Testnet,
};

const MainNetConfig: WalletConfig = {
  derivationPath: "44'/394'/0'/0/0",
  nodeUrl: 'TO_BE_DECIDED',
  ...CroNetwork.Mainnet,
};

export const DefaultWalletConfigs = {
  TestNetConfig,
  MainNetConfig,
};
