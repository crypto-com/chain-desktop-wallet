import { MainNetEvmConfig, TestNetEvmConfig } from '../config/StaticAssets';
import { Bookmark } from '../models/DappBrowser';


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
    }
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
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    blockExplorerUrls: ["https://etherscan.io/"],
    rpcUrls: ["https://cloudflare-eth.com/"],
    nativeCurrency: {
      decimals: 18,
      name: "Ethereum",
      symbol: "ETH"
    }
  }
]


export enum SettingsKey {
  DappBookmarks = 'dapp_book_marks',
  DappDisclaimerDisabledList = 'dapp_disclaimer_disabled_list',
  DappChainConfigs = 'dapp_chain_configs',
  DappSelectedChain = 'dapp_selected_chain'
}

export const DefaultSettings = {
  [SettingsKey.DappBookmarks]: [] as Bookmark[],
  [SettingsKey.DappDisclaimerDisabledList]: [] as string[],
  [SettingsKey.DappChainConfigs]: DAppDefaultChainConfigs,
  [SettingsKey.DappSelectedChain]: DAppDefaultChainConfigs[0],
};

export const getLocalSetting = <T>(key: SettingsKey): T => {
  const localItem = localStorage.getItem(key);

  if (!localItem) {
    return (DefaultSettings[key] as unknown) as T;
  }

  try {
    return JSON.parse(localItem);
  } catch {
    return (localItem as unknown) as T;
  }
};

export const setLocalSetting = <T>(key: SettingsKey, value: T) => {
  const item = typeof value === 'string' ? value : JSON.stringify(value);
  localStorage.setItem(key, item);
};
