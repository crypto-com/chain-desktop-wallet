import { useMemo } from "react";
import { MainNetEvmConfig, TestNetEvmConfig } from "../../../config/StaticAssets";
import { DappBrowserIPC } from "../types";

const useChainConfigs = () => {

  const chainConfigs = useMemo(() => {

    const defaultChainConfigs: DappBrowserIPC.EthereumChainConfig[] = [];

    defaultChainConfigs.push({
      chainId: MainNetEvmConfig.chainId,
      chainName: "Cronos Mainnet",
      blockExplorerUrls: [MainNetEvmConfig.explorerUrl],
      rpcUrls: [MainNetEvmConfig.nodeUrl],
      nativeCurrency: {
        decimals: 18,
        name: "Cronos",
        symbol: "CRO"
      }
    })

    defaultChainConfigs.push({
      chainId: TestNetEvmConfig.chainId,
      chainName: "Cronos Testnet",
      blockExplorerUrls: [TestNetEvmConfig.explorerUrl],
      rpcUrls: [TestNetEvmConfig.nodeUrl],
      nativeCurrency: {
        decimals: 18,
        name: "Cronos test coin",
        symbol: "TCRO"
      }
    })

    defaultChainConfigs.push({
      chainId: "0x1",
      chainName: "Ethereum Mainnet",
      blockExplorerUrls: ["https://etherscan.io/"],
      rpcUrls: ["https://cloudflare-eth.com/"],
      nativeCurrency: {
        decimals: 18,
        name: "Ethereum",
        symbol: "ETH"
      }
    })

    return defaultChainConfigs;
  }, [])


  return {
    chainConfigs
  }

}

export { useChainConfigs };