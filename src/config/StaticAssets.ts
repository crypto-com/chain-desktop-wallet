// Every created wallet get initialized with a new CRO asset
import { getRandomId } from '../crypto/RandomGen';
import { UserAssetType } from '../models/UserAsset';
import { Network } from './StaticConfig';

// Every created wallet get initialized with a new CRO asset
export const CRO_ASSET = (network: Network) => {
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
    assetType: UserAssetType.TENDERMINT,
  };
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const CRONOS_ASSET = (network: Network) => {
  return {
    balance: '0',
    description: '',
    icon_url:
      'https://firebasestorage.googleapis.com/v0/b/chain-desktop-wallet.appspot.com/o/cronos_logo.png?alt=media&token=781c48a3-e89e-4dd4-87d3-d1a1b8e2e456',
    identifier: getRandomId(),
    name: 'Cronos Coin',
    symbol: 'CRONOS',
    mainnetSymbol: 'CRONOS', // This is to be used solely for markets data since testnet market prices is always non existent
    stakedBalance: '0',
    decimals: 18,
    assetType: UserAssetType.EVM,
  };
};
