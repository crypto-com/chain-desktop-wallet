import { CroNetwork } from '@crypto-com/chain-jslib/lib/dist/core/cro';
import { getRandomId } from '../crypto/RandomGen';

export const APP_DB_NAMESPACE = 'data-store';

export const CosmosPorts = {
  Main: ':26657',
  Proxy: ':1317',
};

export type WalletConfig = {
  enabled: boolean;
  name: string;
  explorerUrl: string;
  nodeUrl: string;
  indexingUrl: string;
  derivationPath: string;
  network: Network;
};

const TestNetConfig: WalletConfig = {
  enabled: true,
  name: 'TESTNET',
  derivationPath: "m/44'/1'/0'/0/0",
  explorerUrl: 'https://chain.crypto.com/explorer',
  indexingUrl: 'https://chain.crypto.com/explorer/api/v1/',
  nodeUrl: 'https://testnet-croeseid.crypto.com',
  network: {
    ...CroNetwork.Testnet,
    chainId: 'testnet-croeseid-2',
  },
};

const MainNetConfig: WalletConfig = {
  enabled: false,
  name: 'MAINNET',
  derivationPath: "m/44'/394'/0'/0/0",
  nodeUrl: 'TO_BE_DECIDED',
  explorerUrl: 'TO_BE_DECIDED',
  indexingUrl: 'TO_BE_DECIDED',
  network: CroNetwork.Mainnet,
};

// Supposed to be fully customizable by the user when it will be supported
const CustomDevNet: WalletConfig = {
  derivationPath: '',
  enabled: true,
  name: 'CUSTOM DEVNET',
  network: {
    chainId: '',
    addressPrefix: '',
    bip44Path: { coinType: 0, account: 0 },
    validatorPubKeyPrefix: '',
    validatorAddressPrefix: '',
    coin: { baseDenom: '', croDenom: '' },
  },
  nodeUrl: '',
  indexingUrl: '',
  explorerUrl: '',
};

// Available wallet configs will be presented to the user on wallet creation
// The user can either select default configs available or simply configure their own configuration from scratch
export const DefaultWalletConfigs = {
  TestNetConfig,
  MainNetConfig,
  CustomDevNet,
};

// Every created wallet get initialized with a new CRO asset
export const DefaultAsset = (network: Network) => {
  const assetSymbol = network.coin.croDenom.toString().toUpperCase();
  return {
    balance: '0',
    description:
      'Crypto.com Coin (CRO) is the native token of the Crypto.com Chain. The Crypto.com Chain was created to build a network of cryptocurrency projects, and develop merchants’ ability to accept crypto as a form of payment. The Crypto.com Chain is a high performing native blockchain solution, which will make the transaction flows between crypto users and merchants accepting crypto seamless, cost-efficient and secure.\\r\\n\\r\\nBusinesses can use Crypto.com pay Checkout and/or Invoice to enable customers to complete checkout and pay for goods and services with cryptocurrencies using the Crypto.com Wallet App. Businesses receive all their payments instantly in CRO or stable coins, or in fiat.',
    icon_url:
      'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
    identifier: getRandomId(),
    name: 'Crypto.com Coin',
    symbol: assetSymbol,
    mainnetSymbol: 'CRO', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    decimals: 8,
  };
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

export const FIXED_DEFAULT_FEE = 5_000;
