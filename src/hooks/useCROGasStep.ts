import { useMemo } from "react";
import { atom, useRecoilState } from "recoil";
import { FIXED_DEFAULT_GAS_LIMIT } from "../config/StaticConfig";
import { UserAsset } from "../models/UserAsset";
import { CROGasStep, getLocalSetting, setLocalSetting, SettingsKey } from "../utils/localStorage";
import { getNormalScaleAmount } from "../utils/NumberUtils";

const croGasStep = atom({
  key: 'cro_gas_step',
  default: getLocalSetting<CROGasStep>(SettingsKey.CROGasStep),
});


const GasPriceStep = {
  low: 0.025,
  average: 0.03,
  high: 0.04
}

export const getGasFee = (gasStep: CROGasStep, asset: UserAsset) => {
  const gasPrice = GasPriceStep[gasStep]
  const gasFeeInNumber = gasPrice * Number(asset.config?.fee.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT)
  return gasFeeInNumber.toString()
}
export const getGasFeeInCRO = (gasStep: CROGasStep, asset: UserAsset) => {
  return getNormalScaleAmount(getGasFee(gasStep, asset).toString(), asset)
}

export const useCROGasStep = (asset: UserAsset) => {
  const [gasStep, setGasStep] = useRecoilState(croGasStep);


  const updateGasStep = (step: CROGasStep) => {
    setGasStep(step);
    setLocalSetting(SettingsKey.CROGasStep, step);
  };

  const gasFee = useMemo(() => {
    return getGasFee(gasStep, asset)
  }, [gasStep, asset, getGasFee])

  const gasLimit = useMemo(() => {
    return asset.config?.fee.gasLimit ?? FIXED_DEFAULT_GAS_LIMIT;
  }, [asset])

  return { gasStep, gasFee, gasLimit, updateGasStep };

}
