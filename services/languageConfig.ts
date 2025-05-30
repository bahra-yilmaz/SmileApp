// export interface LanguageItem { // Keep this local definition if it was there
//   code: string; 
//   name: string; 
//   flag: string; 
// }
// import type { LanguageItem } from '../types/language'; // Remove this if LanguageItem is local

export interface LanguageItem {
  code: string; // e.g., 'en', 'es', 'de'
  name: string; // e.g., 'English', 'Español', 'Deutsch' (this might be a translation key itself)
  flag: string; // e.g., '🇺🇸', '🇪🇸', '🇩🇪'
}

export const LANGUAGES: LanguageItem[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' }, // Or 🇺🇸 for US English
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' }, // Or 🇧🇷 for Brazil
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  // Add other languages your app will support
];

// It's also good practice to define your supported languages in your i18n setup.
// For example, in services/i18n.ts, you would list these codes 
// and provide corresponding .json translation files for each. 