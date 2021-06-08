import { CroNetwork } from '@crypto-org-chain/chain-jslib/lib/dist/core/cro';
import { getRandomId } from '../crypto/RandomGen';

export const APP_DB_NAMESPACE = 'data-store';
export const MARKET_API_BASE_URL = 'https://crypto.org/api';
export const NV_GRAPHQL_API_ENDPOINT = 'https://3ona.co/nft-api/graphql';
export const DEFAULT_CLIENT_MEMO = 'client:chain-desktop-app';

export const NodePorts = {
  Tendermint: ':26657',
  Cosmos: ':1317',
};
// maximum in ledger: 2147483647
export const LedgerWalletMaximum = 2147483647;

export type WalletConfig = {
  enabled: boolean;
  name: string;
  explorerUrl: string;
  nodeUrl: string;
  indexingUrl: string;
  derivationPath: string;
  network: Network;
  disableDefaultClientMemo: boolean;
  // When enabled all settings update will be propagated to all wallets of the same network.
  // E.g: User updates nodeURL in one mainnet wallet, all other mainnet wallets will have the new nodeURL
  enableGeneralSettings: boolean;
  analyticsDisabled: boolean;
  fee: {
    gasLimit: string;
    networkFee: string;
  };
};

export const FIXED_DEFAULT_FEE = String(10_000);
export const FIXED_DEFAULT_GAS_LIMIT = String(300_000);

const TestNetConfig: WalletConfig = {
  enabled: true,
  name: 'TESTNET',
  derivationPath: "m/44'/1'/0'/0/0",
  explorerUrl: 'https://crypto.org/explorer/croeseid',
  indexingUrl: 'https://crypto.org/explorer/croeseid/api/v1/',
  nodeUrl: CroNetwork.Testnet.defaultNodeUrl,
  network: CroNetwork.Testnet,
  disableDefaultClientMemo: false,
  enableGeneralSettings: false,
  analyticsDisabled: false,
  fee: {
    gasLimit: FIXED_DEFAULT_GAS_LIMIT,
    networkFee: FIXED_DEFAULT_FEE,
  },
};

const TestNetCroeseid3: WalletConfig = {
  enabled: true,
  name: 'TESTNET CROESEID 3',
  derivationPath: "m/44'/1'/0'/0/0",
  explorerUrl: 'https://crypto.org/explorer/croeseid3',
  indexingUrl: 'https://crypto.org/explorer/croeseid3/api/v1/',
  nodeUrl: CroNetwork.TestnetCroeseid3.defaultNodeUrl,
  network: CroNetwork.TestnetCroeseid3,
  disableDefaultClientMemo: false,
  enableGeneralSettings: false,
  analyticsDisabled: false,
  fee: {
    gasLimit: FIXED_DEFAULT_GAS_LIMIT,
    networkFee: FIXED_DEFAULT_FEE,
  },
};

// This constant value is used when actual values are not known yet
// For instance :
export const NOT_KNOWN_YET_VALUE = 'TO_BE_DECIDED';

const MainNetConfig: WalletConfig = {
  enabled: true,
  name: 'MAINNET',
  derivationPath: "m/44'/394'/0'/0/0",
  nodeUrl: CroNetwork.Mainnet.defaultNodeUrl,
  explorerUrl: 'https://crypto.org/explorer',
  indexingUrl: 'https://crypto.org/explorer/api/v1/',
  network: CroNetwork.Mainnet,
  disableDefaultClientMemo: false,
  enableGeneralSettings: false,
  analyticsDisabled: false,
  fee: {
    gasLimit: FIXED_DEFAULT_GAS_LIMIT,
    networkFee: FIXED_DEFAULT_FEE,
  },
};

// Supposed to be fully customizable by the user when it will be supported
export const CustomDevNet: WalletConfig = {
  derivationPath: "m/44'/394'/0'/0/0",
  enabled: true,
  name: 'CUSTOM DEVNET',
  disableDefaultClientMemo: false,
  enableGeneralSettings: false,
  analyticsDisabled: false,
  network: {
    defaultNodeUrl: '',
    chainId: 'test',
    addressPrefix: 'cro',
    bip44Path: { coinType: 394, account: 0 },
    validatorPubKeyPrefix: 'crocnclpub',
    validatorAddressPrefix: 'crocncl',
    coin: { baseDenom: 'basecro', croDenom: 'cro' },
  },
  nodeUrl: '',
  indexingUrl: '',
  explorerUrl: '',
  fee: {
    gasLimit: FIXED_DEFAULT_GAS_LIMIT,
    networkFee: FIXED_DEFAULT_FEE,
  },
};

// Available wallet configs will be presented to the user on wallet creation
// The user can either select default configs available or simply configure their own configuration from scratch
export const DefaultWalletConfigs = {
  TestNetConfig,
  MainNetConfig,
  CustomDevNet,
  TestNetCroeseid3,
};

// Every created wallet get initialized with a new CRO asset
export const DefaultAsset = (network: Network) => {
  const assetSymbol = network.coin.croDenom.toString().toUpperCase();
  return {
    balance: '0',
    description:
      'Crypto.org Coin (CRO) is the native token of the Crypto.org Chain. The Crypto.org Chain was created to build a network of cryptocurrency projects, and develop merchants’ ability to accept crypto as a form of payment. The Crypto.org Chain is a high performing native blockchain solution, which will make the transaction flows between crypto users and merchants accepting crypto seamless, cost-efficient and secure.\\r\\n\\r\\nBusinesses can use Crypto.org pay Checkout and/or Invoice to enable customers to complete checkout and pay for goods and services with cryptocurrencies using the Crypto.org Wallet App. Businesses receive all their payments instantly in CRO or stable coins, or in fiat.',
    icon_url:
      'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
    identifier: getRandomId(),
    name: 'Crypto.org Coin',
    symbol: assetSymbol,
    mainnetSymbol: 'CRO', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    decimals: 8,
  };
};

// This type is a copy of the Network type defined inside chain-js
// The redefinition is a work-around on limitation to lib to export it
export type Network = {
  defaultNodeUrl: string;
  chainId: string;
  addressPrefix: string;
  bip44Path: { coinType: number; account: number };
  validatorPubKeyPrefix: string;
  validatorAddressPrefix: string;
  coin: { baseDenom: string; croDenom: string };
  rpcUrl?: string;
};
