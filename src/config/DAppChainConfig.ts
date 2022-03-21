import { MainNetEvmConfig, TestNetEvmConfig } from './StaticAssets';

export const DefaultChainConfigIds = ["0x19", "0x152", "0x01"].map(id => parseInt(id, 16));

export const isChainDefaultConfig = (chainId: string) => {
  return DefaultChainConfigIds.includes(parseInt(chainId, 16));
}

export const DAppDefaultChainConfigs = [
  {
    chainId: "0x19",
    chainName: "Cronos Mainnet",
    blockExplorerUrls: [MainNetEvmConfig.explorerUrl],
    rpcUrls: [MainNetEvmConfig.nodeUrl],
    nativeCurrency: {
      decimals: 18,
      name: "Cronos",
      symbol: "CRO"
    },
  },
  {
    chainId: "0x152",
    chainName: "Cronos Testnet",
    blockExplorerUrls: [TestNetEvmConfig.explorerUrl],
    rpcUrls: [TestNetEvmConfig.nodeUrl],
    nativeCurrency: {
      decimals: 18,
      name: "Cronos test coin",
      symbol: "TCRO"
    }
  },
  {
    chainId: "0x01",
    chainName: "Ethereum Mainnet",
    blockExplorerUrls: ["https://etherscan.io/"],
    rpcUrls: ["https://api.mycryptoapi.com/eth"],
    nativeCurrency: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH"
    }
  }
]
