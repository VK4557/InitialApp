/**
 * Translations
 * @format
 */

import { I18nManager } from 'react-native';
import i18n from 'i18next';
import {
  initReactI18next,
  withTranslation,
  useTranslation,
} from 'react-i18next';

import * as Config from '@app/configs';

// Languages
import en from './en.json';
import ar from './ar.json';

const languages = [en, ar];

const resources = languages.reduce((acc, language) => {
  acc[language.key] = { translation: language };
  return acc;
}, {});

i18n.use(initReactI18next).init({
  resources,
  compatibilityJSON: 'v3',
  lng: Config.DEFAULT_LANGUAGE,
  fallbackLng: Object.keys(resources),
  whitelist: Object.keys(resources),
  cleanCode: true,
});

const getCurrentLanguage = () => {
  return i18n.languages[0];
};

const changeI18nLanguage = (language: string) => {
  I18nManager.forceRTL(i18n.dir(language) === 'rtl');
  i18n.changeLanguage(language);
};

export {
  withTranslation,
  useTranslation,
  i18n,
  getCurrentLanguage,
  changeI18nLanguage,
};
