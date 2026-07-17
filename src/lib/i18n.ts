import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';

// English only for v1. Adding a language later is just: translate this
// JSON into te.json/hi.json, register them below, and drive `lng` from
// profile.preferred_language instead of the hardcoded 'en'.
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;