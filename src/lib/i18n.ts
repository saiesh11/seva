import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from '@/locales/en.json';
import hi from '@/locales/hi.json';
import te from '@/locales/te.json';

// `lng` starts as 'en' since profile.preferred_language isn't known yet at
// this point (auth/profile load asynchronously, after this module runs).
// auth-context.tsx calls i18next.changeLanguage() once the profile loads.
i18next.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    te: { translation: te },
    hi: { translation: hi },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18next;