import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language resources
export const resources = {
  en: {
    translation: {
      onboarding: {
        languageSelect: {
          title: 'Choose Your Language',
          subtitle: 'Select your preferred language for the app',
          continue: 'Continue',
        },
      },
      languages: {
        en: 'English',
        tr: 'Türkçe',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        it: 'Italiano',
        pt: 'Português',
        zh: '中文',
      },
      toothbrush: {
        days: 'days',
        used: 'used',
        message: 'Replace soon',
      },
    },
  },
  tr: {
    translation: {
      onboarding: {
        languageSelect: {
          title: 'Dilinizi Seçin',
          subtitle: 'Uygulama için tercih ettiğiniz dili seçin',
          continue: 'Devam Et',
        },
      },
      languages: {
        en: 'English',
        tr: 'Türkçe',
        es: 'Español',
        fr: 'Français',
        de: 'Deutsch',
        it: 'Italiano',
        pt: 'Português',
        zh: '中文',
      },
      toothbrush: {
        days: 'gün',
        used: 'kullanıldı',
        message: 'Yakında değiştir',
      },
    },
  },
};

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
];

// Custom language detector (asynchronous)
const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const savedLanguage = await AsyncStorage.getItem('user-language');
      if (savedLanguage) {
        callback(savedLanguage);
        return;
      }
    } catch (error) {
      console.error('Error reading language from storage:', error);
    }
    callback(Localization.locale.split('-')[0]);
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem('user-language', lng);
    } catch (error) {
      console.error('Error saving language to storage:', error);
    }
  },
};

i18n
  .use(languageDetector as any)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n; 