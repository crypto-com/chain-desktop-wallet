// Every created wallet get initialized with a new CRO asset
import { CroNetwork } from '@crypto-org-chain/chain-jslib/lib/dist/core/cro';
import { getRandomId } from '../crypto/RandomGen';
import { AssetCreationType, UserAssetConfig, UserAssetType } from '../models/UserAsset';
import { Network } from './StaticConfig';

// This will be used later for asset recreation/migration
export const STATIC_ASSET_COUNT = 2;

const checkIfTestnet = (network: Network) => {
  return (
    [CroNetwork.TestnetCroeseid3, CroNetwork.Testnet].includes(network) ||
    network.defaultNodeUrl.includes('testnet')
  );
};

// Every created wallet get initialized with a new CRO asset
export const CRO_ASSET = (network: Network) => {
  const assetSymbol = network.coin.croDenom.toString().toUpperCase();
  const isTestnet = checkIfTestnet(network);

  const config: UserAssetConfig = {
    explorerUrl: isTestnet ? 'https://crypto.org/explorer/croeseid' : 'https://crypto.org/explorer',
    chainId: network.chainId,
    fee: { gasLimit: '300000', networkFee: '10000' },
    indexingUrl: 'https://crypto.org/explorer/croeseid/api/v1/',
    isLedgerSupportDisabled: true,
    isStakingDisabled: true,
    nodeUrl: network.defaultNodeUrl,
    memoSupportDisabled: false,
  };

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
    assetType: UserAssetType.TENDERMINT,
    isSecondaryAsset: false,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CRONOS_ASSET = (network: Network) => {
  const isTestnet = checkIfTestnet(network);

  const config: UserAssetConfig = {
    explorerUrl: 'https://cronos-explorer.crypto.org/',
    chainId: isTestnet ? '338' : 'TO_BE_DECIDED',
    fee: { gasLimit: `21000`, networkFee: `20000000000` },
    indexingUrl: isTestnet ? 'https://cronos-explorer.crypto.org/api' : 'TO_BE_DECIDED',
    isLedgerSupportDisabled: false,
    isStakingDisabled: false,
    nodeUrl: 'https://cronos-testnet.crypto.org:8545/',
    memoSupportDisabled: true,
  };

  return {
    balance: '0',
    description: '',
    icon_url:
      'https://firebasestorage.googleapis.com/v0/b/chain-desktop-wallet.appspot.com/o/cronos_logo.png?alt=media&token=781c48a3-e89e-4dd4-87d3-d1a1b8e2e456',
    identifier: getRandomId(),
    name: 'Cronos Coin',
    symbol: 'CRONOS',
    mainnetSymbol: 'CRO', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    decimals: 18,
    assetType: UserAssetType.EVM,
    isSecondaryAsset: true,
    assetCreationType: AssetCreationType.STATIC,
    config,
  };
};
