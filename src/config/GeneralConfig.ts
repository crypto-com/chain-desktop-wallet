// This is for configuration that span across all wallets
// It's config object for the all app
export interface GeneralConfig {
  hasEverShownAnalyticsPopup: boolean;
  languageCode: string;
  isAppLockedByUser: boolean;
  incorrectUnlockAttempts: number;
}
