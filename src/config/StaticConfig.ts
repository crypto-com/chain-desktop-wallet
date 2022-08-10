import { CroNetwork } from '@crypto-org-chain/chain-jslib/lib/dist/core/cro';

export const INTERCOM_APP_ID = 'yrt83fbd';

export const APP_DB_NAMESPACE = 'data-store';
export const MARKET_API_BASE_URL = 'https://crypto.org/api';
export const COINBASE_TICKER_API_BASE_URL = 'https://api.coinbase.com/v2/';
export const CRYPTO_COM_PRICE_API_BASE_URL = {
  V1: 'https://price-api.crypto.com/price/v1/',
  V2: 'https://price-api.crypto.com/price/v2/',
};
export const NV_GRAPHQL_API_ENDPOINT = 'https://crypto.com/nft-api/graphql';
export const IPFS_MIDDLEWARE_SERVER_UPLOAD_ENDPOINT =
  'https://crypto.org/ipfs-middleware-server/uploads';
export const NCW_NFT_MIDDLEWARE_SERVER_ENDPOINT =
  'https://cronos.org/ncw-quandra-api-middleware-server/quantra/v1/nft';
export const DEFAULT_CLIENT_MEMO = 'client:chain-desktop-app';
export const CLOUDFLARE_TRACE_URI = 'https://www.cloudflare.com/cdn-cgi/trace';

// const APP_PROTOCOL_NAME = 'cryptowallet';
export const APP_PROTOCOL_NAME = 'ledgerlive';

// This constant value is used when actual values are not known yet
// For instance :
export const NOT_KNOWN_YET_VALUE = 'TO_BE_DECIDED';

export const MODERATION_CONFIG_FILE_URL =
  'https://raw.githubusercontent.com/crypto-com/chain-desktop-wallet/dev/config/app.moderation.json';

export const NOTIFICATION_DEV_CONFIG_FILE_URL =
  'https://gist.githubusercontent.com/XinyuCRO/8bb2405059681fdd6e2e2812a2c5aed6/raw/notification.dev.json';
// TODO: change this when PR merged to dev
// export const NOTIFICATION_DEV_CONFIG_FILE_URL = 'https://raw.githubusercontent.com/crypto-com/chain-desktop-wallet/dev/config/notifications/dev.json';
export const NOTIFICATION_RELEASE_CONFIG_FILE_URL =
  'https://raw.githubusercontent.com/crypto-com/chain-desktop-wallet/dev/config/notifications/release.json';

export const UNBLOCKING_PERIOD_IN_DAYS = {
  UNDELEGATION: {
    MAINNET: '28',
    OTHERS: '28',
  },
  REDELEGATION: {
    MAINNET: '28',
    OTHERS: '28',
  },
};

// Reference: Google Sheet : Markets Table - 4 October 2021
export const COUNTRY_CODES_TO_BLOCK = [
  // Afghanistan
  'AF',
  'AFG',
  // Burma(Myanmar)
  'MM',
  'MMR',
  // Burundi
  'BI',
  'BDI',
  // Central African Republic
  'CF',
  'CAF',
  // Congo, Dem. Rep.
  'CD',
  'COD',
  // Cuba
  'CU',
  'CUB',
  // Eritrea
  'ER',
  'ERI',
  // Guinea-Bissau
  'GW',
  'GNB',
  // Guinea, Republic of
  'GN',
  'GIN',
  // Iran
  'IR',
  'IRN',
  // Iraq
  'IQ',
  'IRQ',
  // North Korea
  'KP',
  'PRK',
  // Lebanon
  'LB',
  'LBN',
  // Libya
  'LY',
  'LBY',
  // Mali
  'ML',
  'MLI',
  // Somalia
  'SO',
  'SOM',
  // South Sudan
  'SS',
  'SSD',
  // Sudan
  'SD',
  'SDN',
  // Syria
  'SY',
  'SYR',
  // Venezuela
  'VE',
  'VEN',
  // Yemen
  'YE',
  'YEM',
  // Zimbabwe
  'ZW',
  'ZWE',
  // Unidentified Countries
  NOT_KNOWN_YET_VALUE,
];

export const GEO_BLOCK_TIMEOUT = 4_000;

export const NodePorts = {
  EVM: ':8545',
  Tendermint: ':26657',
  Cosmos: ':1317',
};
// maximum in ledger: 2147483647
export const LedgerWalletMaximum = 2147483647;

export const VALIDATOR_CUMULATIVE_SHARE_PERCENTAGE_THRESHOLD = 33.3;
export const VALIDATOR_UPTIME_THRESHOLD = 0.999;

// 1 year = 60sec * 60 * 24 * 365 = 31536000 sec
export const SECONDS_OF_YEAR = 31536000;

// Max Incorrect Attempts allowed
export const MAX_INCORRECT_ATTEMPTS_ALLOWED = 10;
export const SHOW_WARNING_INCORRECT_ATTEMPTS = 5;

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

export const CRC20_TOKEN_ICON_URL = {
  VVS:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61711b671ef47000c5ac9f78/VVS_Finance_Logo_Token_Symbol-White.png',
  BIFI:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979dd0acbd0e009941cbf0/BIFI_8.png',
  DOGE:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248835568a4017c20a9a6/dogecoin.png',
  ATOM:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5cc8dba7d436cf008a5ad9cd/cosmos.png',
  SWAPP:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/610b8b87d07aba00c6590f3b/SWAPP_cronos_4.png',
  CRONA:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de338a4396a00c5b30250/CRONA_4.png',
  USDT:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c12487f5568a4017c20a999/tether.png',
  USDC:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1251c25afb9500ec2d2ff3/coin_log_usd-coin.png',
  ELK:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/619de4423363e600c5f22dbc/ELK_4.png',
  SMOL:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/61a4da089a45a100c53b189f/SMOL_4.png',
  SHIB:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5f979d61acbd0e009941ca04/SHIBxxxhdpi.png',
  WCRO:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5c1248c15568a4017c20aa87/cro.png',
  DAI:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5e01c4cd49cde700adb27b0d/DAIxxxhdpi.png',
  WETH:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5fc4d2ba3deadb00995dbfc5/WETH-xxxhdpi.png',
  WBTC:
    'https://s3-ap-southeast-1.amazonaws.com/monaco-cointrack-production/uploads/coin/colorful_logo/5eb427298eadfb009885d309/WBTC_4x.png',
};

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
SUPPORTED_CURRENCY.set('NOK', { value: 'NOK', label: 'NOK - kr', symbol: 'kr' });
SUPPORTED_CURRENCY.set('SEK', { value: 'SEK', label: 'SEK - kr', symbol: 'kr' });
SUPPORTED_CURRENCY.set('DKK', { value: 'DKK', label: 'DKK - kr', symbol: 'kr' });
SUPPORTED_CURRENCY.set('CHF', { value: 'CHF', label: 'CHF - CHF', symbol: 'CHF' });
SUPPORTED_CURRENCY.set('PLN', { value: 'PLN', label: 'PLN - zł', symbol: 'zł' });
SUPPORTED_CURRENCY.set('ZAR', { value: 'ZAR', label: 'ZAR - R', symbol: 'R' });
SUPPORTED_CURRENCY.set('KES', { value: 'KES', label: 'KES - KSh', symbol: 'KSh' });
SUPPORTED_CURRENCY.set('RUB', { value: 'RUB', label: 'RUB - ₽', symbol: '₽' });
SUPPORTED_CURRENCY.set('BGN', { value: 'BGN', label: 'BGN - Лв.', symbol: 'Лв.' });
SUPPORTED_CURRENCY.set('RON', { value: 'RON', label: 'RON - lei', symbol: 'lei' });
SUPPORTED_CURRENCY.set('ILS', { value: 'ILS', label: 'ILS - ₪', symbol: '₪' });
SUPPORTED_CURRENCY.set('SAR', { value: 'SAR', label: 'SAR - ر.س', symbol: 'ر.س' });
SUPPORTED_CURRENCY.set('AED', { value: 'AED', label: 'AED - د.إ', symbol: 'د.إ' });
SUPPORTED_CURRENCY.set('HUF', { value: 'HUF', label: 'HUF - Ft', symbol: 'Ft' });
SUPPORTED_CURRENCY.set('CZK', { value: 'CZK', label: 'CZK - Kč', symbol: 'Kč' });
SUPPORTED_CURRENCY.set('BRL', { value: 'BRL', label: 'BRL - R$', symbol: 'R$' });
SUPPORTED_CURRENCY.set('TRY', { value: 'TRY', label: 'TRY - ₺', symbol: '₺' });

export enum SupportedChainName {
  CRYPTO_ORG = 'Crypto.org Chain',
  CRONOS = 'Cronos Chain',
  COSMOS_HUB = 'Cosmos Hub Chain',
  ETHEREUM = 'Ethereum Chain',
}

export enum NetworkName {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
  CUSTOM_DEVNET = 'CUSTOM DEVNET',
}

export type WalletConfig = {
  enabled: boolean;
  name: string;
  explorer: any;
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
export const DEFAULT_IBC_TRANSFER_TIMEOUT = 3_600_000;

export const EVM_MINIMUM_GAS_PRICE = String(42_000_000_000);
export const EVM_MINIMUM_GAS_LIMIT = String(42_000);

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
export const NFT_WRAPPED_ETH_DENOM_SCHEMA = {
  title: 'Asset Metadata',
  type: 'Object',
  properties: {
    isExternal: {
      type: 'boolean',
      description: 'Describes whether the NFT is external or internal to the Crypto.org chain',
    },
    network: {
      type: 'string',
      description: 'Identifies the original network of the NFT',
    },
    identifier: {
      type: 'string',
      description: 'An identifier with the format: {contact_address}/{tokenID}',
    },
  },
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024;

export const AUTO_UPDATE_DISABLE_DURATIONS = [14, 30];

const TestNetConfig: WalletConfig = {
  enabled: true,
  name: NetworkName.TESTNET,
  derivationPath: 'm/44\'/1\'/0\'/0/0',
  explorer: {
    baseUrl: 'https://crypto.org/explorer/croeseid',
    tx: 'https://crypto.org/explorer/croeseid/tx',
    address: 'https://crypto.org/explorer/croeseid/account',
    validator: 'https://crypto.org/explorer/croeseid/validator',
  },
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

const TestnetCroeseid4: Network = {
  defaultNodeUrl: 'https://testnet-croeseid-4.crypto.org',
  chainId: 'testnet-croeseid-4',
  addressPrefix: 'tcro',
  validatorAddressPrefix: 'tcrocncl',
  validatorPubKeyPrefix: 'tcrocnclconspub',
  coin: {
    baseDenom: 'basetcro',
    croDenom: 'tcro',
  },
  bip44Path: {
    coinType: 1,
    account: 0,
  },
  rpcUrl: 'https://testnet-croeseid-4.crypto.org:26657',
};

export const TestNetCroeseid4Config: WalletConfig = {
  enabled: true,
  name: NetworkName.TESTNET,
  derivationPath: 'm/44\'/1\'/0\'/0/0',
  explorer: {
    baseUrl: 'https://crypto.org/explorer/croeseid4',
    tx: 'https://crypto.org/explorer/croeseid4/tx',
    address: 'https://crypto.org/explorer/croeseid4/account',
    validator: 'https://crypto.org/explorer/croeseid4/validator',
  },
  explorerUrl: 'https://crypto.org/explorer/croeseid4',
  indexingUrl: 'https://crypto.org/explorer/croeseid4/api/v1/',
  nodeUrl: TestnetCroeseid4.defaultNodeUrl,
  network: TestnetCroeseid4,
  disableDefaultClientMemo: false,
  enableGeneralSettings: false,
  analyticsDisabled: false,
  fee: {
    gasLimit: FIXED_DEFAULT_GAS_LIMIT,
    networkFee: FIXED_DEFAULT_FEE,
  },
};

export const MainNetConfig: WalletConfig = {
  enabled: true,
  name: NetworkName.MAINNET,
  derivationPath: 'm/44\'/394\'/0\'/0/0',
  nodeUrl: CroNetwork.Mainnet.defaultNodeUrl,
  explorer: {
    baseUrl: 'https://crypto.org/explorer',
    tx: 'https://crypto.org/explorer/tx',
    address: 'https://crypto.org/explorer/account',
    validator: 'https://crypto.org/explorer/validator',
  },
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
  derivationPath: 'm/44\'/394\'/0\'/0/0',
  enabled: true,
  name: NetworkName.CUSTOM_DEVNET,
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
  explorer: {},
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
  TestNetCroeseid4Config,
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
  coin: { baseDenom: string; croDenom: string; denom?: string };
  rpcUrl?: string;
  chainName?: SupportedChainName;
  node?: {
    clientUrl: string;
    proxyUrl: string;
  };
};
