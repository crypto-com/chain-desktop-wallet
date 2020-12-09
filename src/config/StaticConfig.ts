import { CroNetwork } from '@crypto-com/chain-jslib/lib/dist/core/cro';
import { getRandomId } from '../crypto/RandomGen';

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

// Every created wallet get initialized with a new CRO asset
export const DefaultAsset = {
  balance: '0',
  description:
    'Crypto.com Coin (CRO) is the native token of the Crypto.com Chain. The Crypto.com Chain was created to build a network of cryptocurrency projects, and develop merchants’ ability to accept crypto as a form of payment. The Crypto.com Chain is a high performing native blockchain solution, which will make the transaction flows between crypto users and merchants accepting crypto seamless, cost-efficient and secure.\\r\\n\\r\\nBusinesses can use Crypto.com pay Checkout and/or Invoice to enable customers to complete checkout and pay for goods and services with cryptocurrencies using the Crypto.com Wallet App. Businesses receive all their payments instantly in CRO or stable coins, or in fiat.',
  icon_url:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
  identifier: getRandomId(),
  name: 'Crypto.com Coin',
  symbol: 'CRO',
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
