import { getRecoil } from "recoil-nexus";
import { FIXED_DEFAULT_FEE, FIXED_DEFAULT_GAS_LIMIT } from "../config/StaticConfig";
import { sessionState } from "../recoil/atom";
import { getCronosTendermintAsset } from "../utils/utils";
import { walletService } from "./WalletService";

export async function getCronosTendermintFeeConfig() {
  const currentSession = getRecoil(sessionState);
  const allAssets = await walletService.retrieveWalletAssets(
    currentSession.wallet.identifier,
  );
  const chainConfig = getCronosTendermintAsset(allAssets)?.config;

  return {
    networkFee: chainConfig?.fee.networkFee ?? FIXED_DEFAULT_FEE,
    gasLimit: Number(chainConfig?.fee.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT)
  }
}
