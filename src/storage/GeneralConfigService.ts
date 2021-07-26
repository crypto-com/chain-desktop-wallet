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
      };
      await this.saveGeneralConfig(newConfig);
      return false;
    }
    return savedConfig.hasEverShownAnalyticsPopup;
  }
}

export const generalConfigService = new GeneralConfigService('general-config');
