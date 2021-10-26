import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import moment from 'moment';

import translationENUS from './en-US.json';
import translationZHHK from './zh-HK.json';
import translationZHCN from './zh-CN.json';
import translationFRFR from './fr-FR.json';
import translationKOKR from './ko-KR.json';
import translationITIT from './it-IT.json';
import translationESES from './es-ES.json';
import translationTRTR from './tr-TR.json';
import translationVIVN from './vi-VN.json';
import translationIGNG from './ig-NG.json';
import translationARAE from './ar-AE.json';
import translationDEDE from './de-DE.json';

const resources = {
  enUS: {
    translation: translationENUS,
  },
  zhHK: {
    translation: translationZHHK,
  },
  zhCN: {
    translation: translationZHCN,
  },
  frFR: {
    translation: translationFRFR,
  },
  koKR: {
    translation: translationKOKR,
  },
  itIT: {
    translation: translationITIT,
  },
  esES: {
    translation: translationESES,
  },
  trTR: {
    translation: translationTRTR,
  },
  viVN: {
    translation: translationVIVN,
  },
  igNG: {
    translation: translationIGNG,
  },
  arAE: {
    translation: translationARAE,
  },
  deDE: {
    translation: translationDEDE,
  },
};

const languageDetector = new LanguageDetector(async () => {
  return i18n.language;
});

export const setMomentLocale = () => {
  const currentLanguage = i18n.language.replace(/([A-Z])/, '').toLowerCase();
  const currentLanguageLocale = i18n.language.replace(/([A-Z])/, '-$1').toLowerCase();

  moment.defineLocale(currentLanguageLocale, {
    parentLocale: currentLanguage,
  });
  moment.updateLocale(currentLanguageLocale, {
    relativeTime: {
      future: `${i18n.t('general.future')} %s`,
      past: `%s ${i18n.t('general.past')}`,
      s: `${i18n.t('general.second')}`,
      ss: `%d ${i18n.t('general.seconds')}`,
      m: `${i18n.t('general.minute')}`,
      mm: `%d ${i18n.t('general.minutes')}`,
      h: `${i18n.t('general.hour')}`,
      hh: `%d ${i18n.t('general.hours')}`,
      d: `${i18n.t('general.day')}`,
      dd: `%d ${i18n.t('general.days')}`,
      w: `${i18n.t('general.week')}`,
      ww: `%d ${i18n.t('general.weeks')}`,
      M: `${i18n.t('general.month')}`,
      MM: `%d ${i18n.t('general.months')}`,
      y: `${i18n.t('general.year')}`,
      yy: `%d ${i18n.t('general.years')}`,
    },
  });
};

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(languageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'enUS',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources,
  });

setMomentLocale();

export default i18n;
