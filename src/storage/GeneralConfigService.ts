import { DatabaseManager } from './DatabaseManager';
import { GeneralConfig } from '../config/GeneralConfig';
import { DEFAULT_LANGUAGE_CODE } from '../config/StaticConfig';

export class GeneralConfigService {
  private readonly db: DatabaseManager;

  private readonly GENERAL_CONFIG_ID = 'GENERAL_CONFIG_ID';

  constructor(namespace: string) {
    this.db = new DatabaseManager(namespace);
  }

  public async saveGeneralConfig(credential: GeneralConfig) {
    return this.db.generalConfigStore.update<GeneralConfig>(
      { _id: this.GENERAL_CONFIG_ID },
      { $set: credential },
      { upsert: true },
    );
  }

  public async setLanguage(languageCode: string) {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });

    // If config object is not yet created
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        languageCode,
        incorrectUnlockAttempts: 0,
        isAppLockedByUser: false,
      };
      return this.saveGeneralConfig(newConfig);
    }
    savedConfig.languageCode = languageCode;
    return this.saveGeneralConfig(savedConfig);
  }

  public async getLanguage(): Promise<string> {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        incorrectUnlockAttempts: 0,
        isAppLockedByUser: false,
      };
      await this.saveGeneralConfig(newConfig);
      return DEFAULT_LANGUAGE_CODE;
    }
    return savedConfig.languageCode ? savedConfig.languageCode : DEFAULT_LANGUAGE_CODE;
  }

  public async setHasShownAnalyticsPopup(hasShownAnalyticsPopup: boolean) {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });

    // If config object is not yet created
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: hasShownAnalyticsPopup,
      };
      return this.saveGeneralConfig(newConfig);
    }
    savedConfig.hasEverShownAnalyticsPopup = hasShownAnalyticsPopup;
    return this.saveGeneralConfig(savedConfig);
  }

  public async checkIfHasShownAnalyticsPopup(): Promise<boolean> {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        isAppLockedByUser: false,
        incorrectUnlockAttempts: 0,
      };
      await this.saveGeneralConfig(newConfig);
      return false;
    }
    return savedConfig.hasEverShownAnalyticsPopup;
  }

  public async setIsAppLockedByUser(isAppLockedByUser: boolean) {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });

    // If config object is not yet created
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        isAppLockedByUser,
        incorrectUnlockAttempts: 0,
      };
      return this.saveGeneralConfig(newConfig);
    }
    savedConfig.isAppLockedByUser = isAppLockedByUser;
    return this.saveGeneralConfig(savedConfig);
  }

  public async getIfAppIsLockedByUser(): Promise<boolean> {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        isAppLockedByUser: false,
        incorrectUnlockAttempts: 0,
      };
      await this.saveGeneralConfig(newConfig);
      return false;
    }
    return savedConfig.isAppLockedByUser;
  }

  public async incrementIncorrectUnlockAttemptsCountByOne() {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });

    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        isAppLockedByUser: false,
        incorrectUnlockAttempts: 1,
      };
      await this.saveGeneralConfig(newConfig);
      return 1;
    }
    return await this.db.generalConfigStore.update<GeneralConfig>(
      { _id: this.GENERAL_CONFIG_ID },
      { $set: { incorrectUnlockAttempts: savedConfig.incorrectUnlockAttempts + 1 } },
    );
  }

  public async resetIncorrectUnlockAttemptsCount() {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        isAppLockedByUser: false,
        incorrectUnlockAttempts: 0,
      };
      await this.saveGeneralConfig(newConfig);
      return;
    }
    await this.db.generalConfigStore.update<GeneralConfig>(
      { _id: this.GENERAL_CONFIG_ID },
      { $set: { incorrectUnlockAttempts: 0 } },
    );
  }

  public async getIncorrectUnlockAttemptsCount() {
    const savedConfig = await this.db.generalConfigStore.findOne<GeneralConfig>({
      _id: this.GENERAL_CONFIG_ID,
    });
    if (!savedConfig) {
      const newConfig: GeneralConfig = {
        ...(savedConfig as GeneralConfig),
        hasEverShownAnalyticsPopup: false,
        isAppLockedByUser: false,
        incorrectUnlockAttempts: 0,
      };
      await this.saveGeneralConfig(newConfig);
      return 0;
    }
    return savedConfig.incorrectUnlockAttempts;
  }
}

export const generalConfigService = new GeneralConfigService('general-config');
