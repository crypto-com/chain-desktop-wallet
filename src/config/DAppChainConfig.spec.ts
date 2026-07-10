import {
  Chain138MainnetChainConfig,
  DAppDefaultChainConfigs,
  DefaultChainConfigIds,
  isChainDefaultConfig
} from './DAppChainConfig';

describe('DAppChainConfig', () => {
  it('includes Chain 138 as a default EVM dapp network', () => {
    expect(Chain138MainnetChainConfig.chainId).toBe('0x8a');
    expect(parseInt(Chain138MainnetChainConfig.chainId, 16)).toBe(138);
    expect(Chain138MainnetChainConfig.chainName).toBe('DeFi Oracle Meta Mainnet');
    expect(Chain138MainnetChainConfig.rpcUrls).toEqual(['https://rpc.public-0138.defi-oracle.io']);
    expect(Chain138MainnetChainConfig.blockExplorerUrls).toEqual([
      'https://blockscout.defi-oracle.io'
    ]);
  });

  it('marks Chain 138 as a default chain config id', () => {
    expect(DefaultChainConfigIds).toContain(138);
    expect(DAppDefaultChainConfigs).toContainEqual(Chain138MainnetChainConfig);
    expect(isChainDefaultConfig('0x8a')).toBe(true);
  });
});
