import { setRecoil } from "recoil-nexus";
import { Session } from "../../models/Session";
import { UserAsset } from "../../models/UserAsset";
import { sessionState, walletAllAssetsState, walletListState } from "../../recoil/atom";
import { AnalyticsService } from "../../service/analytics/AnalyticsService";
import { walletService } from "../../service/WalletService";

export async function updateGasInfo(currentSession: Session, asset: UserAsset, newGasLimit: string, newGasPrice: string, analyticsService: AnalyticsService) {
  const updatedWallet = await walletService.findWalletByIdentifier(
    currentSession.wallet.identifier,
  );

  const newlyUpdatedAsset = {
    ...asset,
    config: {
      ...asset.config,
      fee: { gasLimit: newGasLimit, networkFee: newGasPrice },
    },
  };


  await walletService.saveAssets([newlyUpdatedAsset as UserAsset]);

  const newSession = {
    ...currentSession,
    wallet: updatedWallet,
    activeAsset: newlyUpdatedAsset,
  };
  setRecoil(sessionState, newSession as Session);

  await walletService.setCurrentSession(newSession as Session);

  const allNewUpdatedWallets = await walletService.retrieveAllWallets();
  setRecoil(walletListState, [...allNewUpdatedWallets]);

  const allAssets = await walletService.retrieveCurrentWalletAssets(newSession as Session);
  setRecoil(walletAllAssetsState, [...allAssets]);
  analyticsService.logCustomizeGas(asset.assetType ?? '');
}
