import { CroNetwork } from '@crypto-org-chain/chain-jslib/lib/dist/core/cro';

export const APP_DB_NAMESPACE = 'data-store';
export const MARKET_API_BASE_URL = 'https://crypto.org/api';
export const COINBASE_TICKER_API_BASE_URL = 'https://api.coinbase.com/v2/';
export const NV_GRAPHQL_API_ENDPOINT = 'https://crypto.com/nft-api/graphql';
export const IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT =
  'https://crypto.org/ipfs-middleware-server/uploads';
export const DEFAULT_CLIENT_MEMO = 'client:chain-desktop-app';

export const NodePorts = {
  Tendermint: ':26657',
  Cosmos: ':1317',
};
// maximum in ledger: 2147483647
export const LedgerWalletMaximum = 2147483647;
export const CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD = 33.3;

export const DEFAULT_LANGUAGE_CODE = 'enUS';
export const SUPPORTED_LANGUAGE = [
  { value: 'enUS', label: 'English' },
  { value: 'zhHK', label: '繁體中文' },
  { value: 'zhCN', label: '简体中文' },
  { value: 'koKR', label: '한국어' },
];

export interface SupportedCurrency {
  value: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCY = new Map<string, SupportedCurrency>();
SUPPORTED_CURRENCY.set('USD', { value: 'USD', label: 'USD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('GBP', { value: 'GBP', label: 'GBP - £', symbol: '£' });
SUPPORTED_CURRENCY.set('EUR', { value: 'EUR', label: 'EUR - €', symbol: '€' });
SUPPORTED_CURRENCY.set('SGD', { value: 'SGD', label: 'SGD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('CAD', { value: 'CAD', label: 'CAD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('AUD', { value: 'AUD', label: 'AUD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('NZD', { value: 'NZD', label: 'NZD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('HKD', { value: 'HKD', label: 'HKD - $', symbol: '$' });
SUPPORTED_CURRENCY.set('TWD', { value: 'TWD', label: 'TWD - $', symbol: '$' });

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

export const NFT_IMAGE_DENOM_SCHEMA = {
  title: 'Asset Metadata',
  type: 'Object',
  properties: {
    description: {
      type: 'string',
      description: 'Describes the asset to which this NFT represents',
    },
    name: {
      type: 'string',
      description: 'Identifies the asset to which this NFT represents',
    },
    image: {
      type: 'string',
      description: 'A URI pointing to a resource with mime type image',
    },
    mimeType: {
      type: 'string',
      description: 'Describes the type of represented NFT media',
    },
  },
};
export const NFT_VIDEO_DENOM_SCHEMA = {
  title: 'Asset Metadata',
  type: 'Object',
  properties: {
    description: {
      type: 'string',
      description: 'Describes the asset to which this NFT represents',
    },
    name: {
      type: 'string',
      description: 'Identifies the asset to which this NFT represents',
    },
    image: {
      type: 'string',
      description: 'A URI pointing to a resource with mime type image',
    },
    animation_url: {
      type: 'string',
      description: 'A URI pointing to a resource with mime type video',
    },
    mimeType: {
      type: 'string',
      description: 'Describes the type of represented NFT media',
    },
  },
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

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
