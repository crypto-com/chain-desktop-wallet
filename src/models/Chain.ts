
export interface EVMChainNativeCurrency {
  decimals: number;
  name: string;
  symbol: string;
}

export interface EVMChainConfig {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  nativeCurrency: EVMChainNativeCurrency;
  blockExplorerUrls: string[]
}
