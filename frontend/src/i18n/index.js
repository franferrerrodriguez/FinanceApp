import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './config';
import en from '../locales/en.json';
import es from '../locales/es.json';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: SUPPORTED_LOCALES,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
