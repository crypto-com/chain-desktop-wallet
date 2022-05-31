import { DAppDefaultChainConfigs } from '../config/DAppChainConfig';
import { Bookmark } from '../models/DappBrowser';


export enum SettingsKey {
  DappBookmarks = 'dapp_book_marks',
  DappDisclaimerDisabledList = 'dapp_disclaimer_disabled_list',
  DappChainConfigs = 'dapp_chain_configs',
  DappSelectedChain = 'dapp_selected_chain',
  CROGasStep = 'cro_gas_step',
}

export type CROGasStep = 'low' | 'average' | 'high'

export const DefaultSettings = {
  [SettingsKey.DappBookmarks]: [] as Bookmark[],
  [SettingsKey.DappDisclaimerDisabledList]: [] as string[],
  [SettingsKey.DappChainConfigs]: DAppDefaultChainConfigs,
  [SettingsKey.DappSelectedChain]: DAppDefaultChainConfigs[0],
  [SettingsKey.CROGasStep]: 'average' as CROGasStep,
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
