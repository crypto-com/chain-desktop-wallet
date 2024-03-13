// Every created wallet get initialized with a new CRO asset
import { getRandomId } from '../crypto/RandomGen';
import { AssetCreationType, UserAsset, UserAssetConfig, UserAssetType } from '../models/UserAsset';
import { WalletConfig, SupportedChainName } from './StaticConfig';
import { checkIfTestnet } from '../utils/utils';
import { ICON_ATOM_TENDERMINT, ICON_CRO_EVM, ICON_CRO_TENDERMINT, ICON_ETH_EVM } from '../components/AssetIcon';
import { Session } from '../models/Session';
import { TestNetCroeseid5Config, MainNetConfig } from './StaticConfig';

// This will be used later for asset recreation/migration
export const STATIC_ASSET_COUNT = 4;

// Update Explorer Url - https://cronoscan.com
export const MAINNET_EVM_EXPLORER_URL = 'https://cronoscan.com';
// There's no testnet explorer on cronoscan.com. Use cronos.org/explorer instead.
export const TESTNET_EVM_EXPLORER_URL = 'https://cronos.org/explorer/testnet3';

export const MAINNET_ETHEREUM_EXPLORER_URL = 'https://etherscan.io';
export const ROPSTEN_ETHEREUM_EXPLORER_URL = 'https://ropsten.etherscan.io';
export const RINKEBY_ETHEREUM_EXPLORER_URL = 'https://rinkeby.etherscan.io';
export const GOERLI_ETHEREUM_EXPLORER_URL = 'https://goerli.etherscan.io/';

export const MAINNET_TENDERMINT_COSMOS_HUB_EXPLORER_URL = 'https://www.mintscan.io/cosmos';
export const TESTNET_TENDERMINT_COSMOS_HUB_EXPLORER_URL =
  'https://explorer.theta-testnet.polypore.xyz';

export const TestNetEvmConfig: UserAssetConfig = {
  explorer: {
    tx: `${TESTNET_EVM_EXPLORER_URL}/tx`,
    address: `${TESTNET_EVM_EXPLORER_URL}/address`,
  },
  explorerUrl: TESTNET_EVM_EXPLORER_URL,
  chainId: '338',
  fee: { gasLimit: '50000', networkFee: '20000000000' },
  indexingUrl: 'https://cronos.org/explorer/testnet3/api',
  isLedgerSupportDisabled: false,
  isStakingDisabled: false,
  nodeUrl: 'https://evm-t3.cronos.org/',
  memoSupportDisabled: true,
};

export const MainNetEvmConfig: UserAssetConfig = {
  explorer: {
    tx: `${MAINNET_EVM_EXPLORER_URL}/tx`,
    address: `${MAINNET_EVM_EXPLORER_URL}/address`,
  },
  explorerUrl: MAINNET_EVM_EXPLORER_URL,
  chainId: '25',
  fee: { gasLimit: '50000', networkFee: '20000000000' },
  // indexingUrl sticks with https://cronos.org/explorer for now
  indexingUrl: 'https://cronos.org/explorer/api',
  isLedgerSupportDisabled: false,
  isStakingDisabled: false,
  nodeUrl: 'https://evm.cronos.org',
  memoSupportDisabled: true,
};

// Every created wallet get initialized with a new CRO asset
export const CRONOS_TENDERMINT_ASSET = (walletConfig: WalletConfig) => {
  const { network } = walletConfig;
  const isTestnet = checkIfTestnet(network);

  const config: UserAssetConfig = {
    explorerUrl: isTestnet ? TestNetCroeseid5Config.explorerUrl : MainNetConfig.explorerUrl,
    explorer: isTestnet ? TestNetCroeseid5Config.explorer : MainNetConfig.explorer,
    chainId: isTestnet ? TestNetCroeseid5Config.network.chainId : MainNetConfig.network.chainId,
    fee: { 
      gasLimit: isTestnet ? TestNetCroeseid5Config.fee.gasLimit : MainNetConfig.fee.gasLimit,
      networkFee: isTestnet ? TestNetCroeseid5Config.fee.networkFee : MainNetConfig.fee.networkFee,
    },
    indexingUrl: isTestnet ? TestNetCroeseid5Config.indexingUrl : MainNetConfig.indexingUrl,
    isLedgerSupportDisabled: true,
    isStakingDisabled: true,
    nodeUrl: isTestnet ? TestNetCroeseid5Config.nodeUrl : MainNetConfig.nodeUrl,
    memoSupportDisabled: false,
    tendermintNetwork: {
      defaultNodeUrl: isTestnet
        ? 'https://rpc-c5.cronos-pos.org'
        : 'https://rpc.mainnet.cronos-pos.org',
      chainName: SupportedChainName.CRONOS_TENDERMINT,
      chainId: isTestnet ? 'testnet-croeseid-5' : MainNetConfig.network.chainId,
      addressPrefix: isTestnet ? 'tcro' : 'cro',
      validatorPubKeyPrefix: isTestnet ? 'tcrocnclconspub' : 'crocnclconspub',
      validatorAddressPrefix: isTestnet ? 'tcrocncl' : 'crocncl',
      bip44Path: { coinType: 394, account: 0 },
      coin: { 
        baseDenom: isTestnet ? 'basetcro' : 'basecro', 
        croDenom: isTestnet ? 'tcro' : 'cro', 
        denom: isTestnet ? 'tcro' : 'cro'
      },
      node: {
        clientUrl: isTestnet
          ? 'https://rpc-c5.cronos-pos.org'
          : 'https://rpc.mainnet.cronos-pos.org',
        proxyUrl: isTestnet
          ? 'https://rest-c5.cronos-pos.org'
          : 'https://rest.mainnet.cronos-pos.org',
      },
    },
  };

  return {
    balance: '0',
    description:
      'Cronos (CRO) is the native token of the Cronos POS Chain. The Cronos POS Chain was created to build a network of cryptocurrency projects, and develop merchants’ ability to accept crypto as a form of payment. The Cronos POS Chain is a high performing native blockchain solution, which will make the transaction flows between crypto users and merchants accepting crypto seamless, cost-efficient and secure.\\r\\n\\r\\nBusinesses can use Cronos POS pay Checkout and/or Invoice to enable customers to complete checkout and pay for goods and services with cryptocurrencies using the Crypto.org Wallet App. Businesses receive all their payments instantly in CRO or stable coins, or in fiat.',
    icon_url: ICON_CRO_TENDERMINT,
    identifier: getRandomId(),
    name: SupportedChainName.CRONOS_TENDERMINT,
    symbol: isTestnet ? TestNetCroeseid5Config.network.coin.croDenom.toString().toUpperCase() : MainNetConfig.network.coin.croDenom.toString().toUpperCase(),
    mainnetSymbol: 'CRO', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    unbondingBalance: '0',
    rewardsBalance: '0',
    decimals: 8,
    assetType: UserAssetType.TENDERMINT,
    isSecondaryAsset: false,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};

// Every created wallet get initialized with a new CRO asset
export const ATOM_TENDERMINT_ASSET = (walletConfig: WalletConfig) => {
  const { network } = walletConfig;
  const assetSymbol = 'ATOM';
  const isTestnet = checkIfTestnet(network);
  const explorerUrl = isTestnet
    ? TESTNET_TENDERMINT_COSMOS_HUB_EXPLORER_URL
    : MAINNET_TENDERMINT_COSMOS_HUB_EXPLORER_URL;

  const config: UserAssetConfig = {
    explorerUrl,
    explorer: {
      baseUrl: `${explorerUrl}`,
      tx: isTestnet ? `${explorerUrl}/transactions` : `${explorerUrl}/txs`,
      address: `${explorerUrl}/account`,
      validator: isTestnet ? `${explorerUrl}/validator` : `${explorerUrl}/validators`,
    },
    chainId: isTestnet ? 'theta-testnet-001' : 'cosmoshub-4',
    fee: { gasLimit: '200000', networkFee: '1000' },
    indexingUrl: isTestnet
      ? ''
      : 'https://cronos.org/ncw-quandra-api-middleware-server/quantra/adapter/api',
    isLedgerSupportDisabled: true,
    isStakingDisabled: true,
    nodeUrl: isTestnet
      ? 'https://rpc.sentry-01.theta-testnet.polypore.xyz'
      : 'https://eth-indexing.crypto.org/cosmos/mainnet/rpc',
    memoSupportDisabled: false,
    tendermintNetwork: {
      defaultNodeUrl: isTestnet
        ? 'https://rpc.sentry-01.theta-testnet.polypore.xyz'
        : 'https://eth-indexing.crypto.org/cosmos/mainnet/rpc',
      chainName: SupportedChainName.COSMOS_HUB,
      chainId: isTestnet ? 'theta-testnet-001' : 'cosmoshub-4',
      addressPrefix: 'cosmos',
      validatorPubKeyPrefix: 'cosmosvaloperpub',
      validatorAddressPrefix: 'cosmosvaloper',
      bip44Path: { coinType: 118, account: 0 },
      coin: { baseDenom: 'uatom', croDenom: 'atom', denom: 'atom' },
      node: {
        clientUrl: isTestnet
          ? 'https://rpc.sentry-01.theta-testnet.polypore.xyz'
          : 'https://eth-indexing.crypto.org/cosmos/mainnet/rpc',
        proxyUrl: isTestnet
          ? 'https://rest.sentry-01.theta-testnet.polypore.xyz'
          : 'https://eth-indexing.crypto.org/cosmos/mainnet/rest',
      },
    },
  };

  return {
    balance: '0',
    description: 'ATOM',
    icon_url: ICON_ATOM_TENDERMINT,
    identifier: getRandomId(),
    name: SupportedChainName.COSMOS_HUB,
    symbol: assetSymbol,
    mainnetSymbol: 'ATOM', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    unbondingBalance: '0',
    rewardsBalance: '0',
    decimals: 6,
    assetType: UserAssetType.TENDERMINT,
    isSecondaryAsset: true,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CRONOS_EVM_ASSET = (walletConfig: WalletConfig) => {
  const { network } = walletConfig;

  const isTestnet = checkIfTestnet(network);

  const config: UserAssetConfig = isTestnet ? TestNetEvmConfig : MainNetEvmConfig;

  return {
    balance: '0',
    description: '',
    icon_url: ICON_CRO_EVM,
    identifier: getRandomId(),
    name: SupportedChainName.CRONOS,
    symbol: isTestnet ? 'TCRO' : 'CRO',
    mainnetSymbol: 'CRO', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    unbondingBalance: '0',
    rewardsBalance: '0',
    decimals: 18,
    assetType: UserAssetType.EVM,
    isSecondaryAsset: true,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};

export const ETH_ASSET = (walletConfig: WalletConfig) => {
  const { network } = walletConfig;

  const isTestnet = checkIfTestnet(network);

  const config: UserAssetConfig = {
    explorer: {
      tx: isTestnet ? `${GOERLI_ETHEREUM_EXPLORER_URL}/tx` : `${MAINNET_ETHEREUM_EXPLORER_URL}/tx`,
      address: isTestnet
        ? `${GOERLI_ETHEREUM_EXPLORER_URL}/address`
        : `${MAINNET_ETHEREUM_EXPLORER_URL}/address`,
    },
    explorerUrl: isTestnet
      ? `${GOERLI_ETHEREUM_EXPLORER_URL}`
      : `${MAINNET_ETHEREUM_EXPLORER_URL}`,

    chainId: isTestnet ? '5' : '1',

    fee: { gasLimit: '50000', networkFee: '20000000000' },
    indexingUrl: isTestnet
      ? 'https://eth-indexing.crypto.org/ethereum/goerli/api/v1'
      : 'https://eth-indexing.crypto.org/ethereum/mainnet/api/v1',
    isLedgerSupportDisabled: false,
    isStakingDisabled: false,
    nodeUrl: isTestnet
      ? 'https://eth-indexing.crypto.org/ethereum/goerli/rpc'
      : 'https://eth-indexing.crypto.org/ethereum/mainnet/rpc',
    memoSupportDisabled: true,
  };

  return {
    balance: '0',
    description: '',
    icon_url: ICON_ETH_EVM,
    identifier: getRandomId(),
    name: SupportedChainName.ETHEREUM,
    symbol: 'ETH',
    mainnetSymbol: 'ETH', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    unbondingBalance: '0',
    rewardsBalance: '0',
    decimals: 18,
    assetType: UserAssetType.EVM,
    isSecondaryAsset: true,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};

export const getDefaultUserAssetConfig = (asset: UserAsset | undefined, session: Session) => {
  if(!asset) return null;

  const { assetType, name } = asset;
  const { config } = session.wallet; 

  switch (`${assetType}-${name}`) {
    case `${UserAssetType.TENDERMINT}-${SupportedChainName.COSMOS_HUB}`:
      return ATOM_TENDERMINT_ASSET(config);
    case `${UserAssetType.TENDERMINT}-${SupportedChainName.CRONOS_TENDERMINT}`:
      return CRONOS_TENDERMINT_ASSET(config);
    case `${UserAssetType.EVM}-${SupportedChainName.CRONOS}`:
      return CRONOS_EVM_ASSET(config);
    case `${UserAssetType.EVM}-${SupportedChainName.ETHEREUM}`:
      return ETH_ASSET(config);
    default:
      return null;
  }
};

export const checkIsDefaultUserAssetConfig = (asset: UserAsset | undefined, session: Session) => {
  if (!asset) return false;

  const defaultConfig = getDefaultUserAssetConfig(asset, session);

  if (!defaultConfig) return false;

  const { nodeUrl, indexingUrl, chainId } = defaultConfig.config;

  if (
    nodeUrl === asset.config?.nodeUrl &&
    indexingUrl === asset.config?.indexingUrl &&
    chainId === asset.config?.chainId
  ) return true;

  return false;
};