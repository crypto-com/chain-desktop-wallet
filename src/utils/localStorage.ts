import { Bookmark } from '../models/DappBrowser';

export enum SettingsKey {
  DappBookmarks = 'dapp_book_marks',
  DappDisclaimerDisabledList = 'dapp_disclaimer_disabled_list',
}

export const DefaultSettings = {
  [SettingsKey.DappBookmarks]: [] as Bookmark[],
  [SettingsKey.DappDisclaimerDisabledList]: [] as string[],
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
