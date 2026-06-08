import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './constants/translations/en.json';

// Safely detect user system locale languageCode
let languageTag = 'en';
try {
  const Localization = require('expo-localization');
  const locales = Localization.getLocales();
  if (locales && locales.length > 0 && locales[0].languageCode) {
    languageTag = locales[0].languageCode;
  }
} catch (error) {
  // Gracefully fallback to English if the native ExpoLocalization module is not available in the runtime client
  console.warn('[i18n] Failed to load expo-localization or detect system locale, falling back to "en":', error.message);
}

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
