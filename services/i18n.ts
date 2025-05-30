import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

// Import your language resources
import enTranslations from './locales/en.json';
import esTranslations from './locales/es.json'; // Import Spanish translations
import deTranslations from './locales/de.json'; // Assuming you will create this
import frTranslations from './locales/fr.json'; // Assuming you will create this
import trTranslations from './locales/tr.json';
import ptTranslations from './locales/pt.json';
import jaTranslations from './locales/ja.json';
import hiTranslations from './locales/hi.json';

console.log('[i18n Service DEBUG] Imported enTranslations:', JSON.stringify(enTranslations, null, 2));
console.log('[i18n Service DEBUG] Imported esTranslations:', JSON.stringify(esTranslations, null, 2)); // Log Spanish translations
// Add logs for other new languages as needed

// Later, you would add other languages like this:
// import deTranslations from './locales/de.json'; 
// import esTranslations from './locales/es.json';

i18next
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    debug: true, // Enable i18next debug logging
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: enTranslations }, // Use the imported JSON
      es: { translation: esTranslations }, // Add Spanish resources
      de: { translation: deTranslations }, // Add German resources
      fr: { translation: frTranslations }, // Add French resources
      tr: { translation: trTranslations }, 
      pt: { translation: ptTranslations }, 
      ja: { translation: jaTranslations }, 
      hi: { translation: hiTranslations }, 
    },
    lng: Localization.getLocales()[0]?.languageCode || 'en', // Get device language or default to English
    fallbackLng: 'en', // Fallback language if a translation is missing
    interpolation: {
      escapeValue: false, // React already safes from xss
    },
    react: {
      useSuspense: false, // Set to true if you want to use Suspense for translation loading
    },
  }, (err, t) => {
    if (err) return console.error('[i18n Service DEBUG] Error initializing i18next:', err);
    console.log('[i18n Service DEBUG] i18next initialized successfully.');
    // You can try a test translation here too
    // console.log('[i18n Service DEBUG] Test translation from init callback for common.ok:', t('common.ok'));
  });

export default i18next; 