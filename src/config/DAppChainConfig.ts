import { EVMChainConfig } from '../models/Chain';
import { MainNetEvmConfig, TestNetEvmConfig } from './StaticAssets';

export const CronosMainnetChainConfig: EVMChainConfig = {
  chainId: '0x19',
  chainName: 'Cronos Mainnet',
  blockExplorerUrls: [MainNetEvmConfig.explorerUrl],
  rpcUrls: [MainNetEvmConfig.nodeUrl],
  nativeCurrency: {
    decimals: 18,
    name: 'Cronos',
    symbol: 'CRO'
  },
};

export const CronosTestnetChainConfig: EVMChainConfig = {
  chainId: '0x152',
  chainName: 'Cronos Testnet',
  blockExplorerUrls: [TestNetEvmConfig.explorerUrl],
  rpcUrls: [TestNetEvmConfig.nodeUrl],
  nativeCurrency: {
    decimals: 18,
    name: 'Cronos test coin',
    symbol: 'TCRO'
  }
};

export const Chain138MainnetChainConfig: EVMChainConfig = {
  chainId: '0x8a',
  chainName: 'DeFi Oracle Meta Mainnet',
  blockExplorerUrls: ['https://blockscout.defi-oracle.io'],
  rpcUrls: ['https://rpc.public-0138.defi-oracle.io'],
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH'
  }
};

export const DAppDefaultChainConfigs = [
  CronosMainnetChainConfig,
  CronosTestnetChainConfig,
  Chain138MainnetChainConfig,
  // {
  //   chainId: "0x01",
  //   chainName: "Ethereum Mainnet",
  //   blockExplorerUrls: ["https://etherscan.io/"],
  //   rpcUrls: ["https://api.mycryptoapi.com/eth"],
  //   nativeCurrency: {
  //     decimals: 18,
  //     name: "Ethereum",
  //     symbol: "ETH"
  //   }
  // }
];

export const DefaultChainConfigIds = DAppDefaultChainConfigs.map(config => parseInt(config.chainId, 16));

export const isChainDefaultConfig = (chainId: string) => {
  return DefaultChainConfigIds.includes(parseInt(chainId, 16));
};
