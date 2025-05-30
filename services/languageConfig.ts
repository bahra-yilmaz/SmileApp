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
  // Add other languages your app will support
];

// It's also good practice to define your supported languages in your i18n setup.
// For example, in services/i18n.ts, you would list these codes 
// and provide corresponding .json translation files for each. 