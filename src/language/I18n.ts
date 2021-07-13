import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { generalConfigService } from '../storage/GeneralConfigService';

let savedLanguage: string = '';

const getLanguageFromDB = async () => {
  const language = await generalConfigService.getLanguage();
  savedLanguage = language;
};

getLanguageFromDB();

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    lng: savedLanguage,
    // fallbackLng: 'zh',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: {
          language: 'Language',
          welcome: 'Welcome Back!',
        },
      },
      zh: {
        translation: {
          language: '語言',
          welcome: '歡迎!',
        },
      },
    },
  });

export default i18n;
