import { WalletConfig } from '../../config/StaticConfig';
import { UserAssetConfig } from '../../models/UserAsset';

export function getAssetConfigFromWalletConfig(walletConfig: WalletConfig): UserAssetConfig {
  return {
    chainId: walletConfig.network.chainId,
    explorer: walletConfig.explorer,
    explorerUrl: walletConfig.explorerUrl,
    fee: { gasLimit: walletConfig.fee.gasLimit, networkFee: walletConfig.fee.networkFee },
    indexingUrl: walletConfig.indexingUrl,
    isLedgerSupportDisabled: false,
    isStakingDisabled: false,
    nodeUrl: walletConfig.nodeUrl,
  };
}
