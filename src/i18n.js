import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './constants/translations/en.json';

// Detect user system locale languageCode
const locales = Localization.getLocales();
const languageTag = locales[0]?.languageCode ?? 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: languageTag,
    fallbackLng: 'en',
    compatibilityJSON: 'v3', // Required for React Native to support standard pluralization
    keySeparator: false, // Critical to support flat dotted keys such as onboarding.welcome.title
    interpolation: {
      escapeValue: false, // React already escapes values by default
    },
  });

export default i18n;
