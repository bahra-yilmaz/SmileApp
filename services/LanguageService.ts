import supabase from './supabaseClient';
import i18n from './i18n';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES } from './languageConfig';

const LANGUAGE_STORAGE_KEY = 'user_language_preference';

export class LanguageService {
  /**
   * Gets the user's saved language preference from the database
   */
  static async getUserLanguage(userId: string): Promise<string | null> {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('language')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid PGRST116 errors

      if (error) {
        console.error('Error fetching user language:', error);
        return null;
      }

      return data?.language || null;
    } catch (error) {
      console.error('Failed to get user language:', error);
      return null;
    }
  }

  /**
   * Saves the user's language preference to the database
   */
  static async setUserLanguage(userId: string, languageCode: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');

    console.log(`💾 Attempting to save language to database...`, { userId, languageCode });

    try {
      // Use upsert to handle cases where user record doesn't exist yet
      console.log('💾 Executing upsert query...');
      const upsertPromise = supabase
        .from('users')
        .upsert({
          id: userId,
          language: languageCode,
          target_time_in_sec: 120, // Set default target time if creating new record
        }, {
          onConflict: 'id',
          ignoreDuplicates: false,
        })
        .select(); // Add select to see what was actually saved
      
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
      );

      const { data, error } = await Promise.race([upsertPromise, timeoutPromise]);

      console.log('💾 Upsert result:', { data, error });

      if (error) {
        console.error('❌ Database upsert error:', error);
        // Check if it's an RLS/permission error
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.error('🚨 RLS POLICY ERROR: User cannot write to users table!');
          console.error('🔧 Need to run: CREATE POLICY "Users can update own record" ON users FOR UPDATE USING (auth.uid() = id);');
        }
        // Throw the specific error to be handled by the UI
        throw new Error(`Failed to save language preference: ${error.message}`);
      }

      // Also save to local storage as backup
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      
      console.log(`✅ Language preference saved to database successfully:`, data);
    } catch (error) {
      console.error('❌ Failed to set user language, saving to local storage as fallback:', error);
      
      // Save to local storage as a fallback so the choice is not lost
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
      
      // Re-throw the error so the UI can handle it (e.g., show an alert)
      throw error;
    }
  }

  /**
   * Loads and applies the user's language preference
   * Falls back to device language, then to English
   * For authenticated users, transfers local storage preference to database if needed
   */
  static async loadAndApplyUserLanguage(userId?: string): Promise<string> {
    let languageCode: string | null = null;
    let localStorageLanguage: string | null = null;
    let databaseLanguage: string | null = null;

    // 1. Try to get from database if user is authenticated
    if (userId) {
      databaseLanguage = await this.getUserLanguage(userId);
      languageCode = databaseLanguage;
    }

    // 2. Try to get from local storage as backup
    try {
      localStorageLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (!languageCode) {
        languageCode = localStorageLanguage;
      }
    } catch (error) {
      console.warn('Failed to load language from storage:', error);
    }

    // 3. Transfer local preference to database if user is authenticated, 
    //    we found a local preference, but no database preference
    if (userId && localStorageLanguage && !databaseLanguage) {
      try {
        console.log(`🔄 Transferring local language preference (${localStorageLanguage}) to database...`);
        await this.setUserLanguage(userId, localStorageLanguage);
        console.log(`✅ Language preference transferred to database: ${localStorageLanguage}`);
      } catch (error) {
        console.error('Failed to transfer language preference to database:', error);
        // Continue with local preference anyway
      }
    }

    // 4. Fall back to device language
    if (!languageCode) {
      const deviceLocales = Localization.getLocales();
      languageCode = deviceLocales[0]?.languageCode || 'en';
    }

    // 5. Fall back to English if all else fails
    if (!languageCode) {
      languageCode = 'en';
    }

    // Apply the language to i18n
    try {
      await i18n.changeLanguage(languageCode);
      console.log(`🌐 Language applied: ${languageCode}`);
    } catch (error) {
      console.error('Failed to change language:', error);
      // Fall back to English if language change fails
      await i18n.changeLanguage('en');
      languageCode = 'en';
    }

    return languageCode;
  }

  /**
   * Gets the currently active language
   */
  static getCurrentLanguage(): string {
    return i18n.language || 'en';
  }

  /**
   * Checks if a language code is supported
   */
  static isSupportedLanguage(languageCode: string): boolean {
    return LANGUAGES.some(lang => lang.code === languageCode);
  }

  /**
   * Changes the language and saves the preference if user is authenticated
   */
  static async changeLanguage(languageCode: string, userId?: string): Promise<void> {
    if (!this.isSupportedLanguage(languageCode)) {
      throw new Error(`Language ${languageCode} is not supported`);
    }

    // Change the language in i18n
    await i18n.changeLanguage(languageCode);

    // Default to guest mode logging
    let logMessage = `👻 Language changed to '${languageCode}' (guest preference saved locally).`;

    // Always save to local storage (for both guests and authenticated users)
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } catch (error) {
      console.warn('Failed to save language to storage:', error);
    }

    // Save to database if user is authenticated
    if (userId) {
      try {
        await this.setUserLanguage(userId, languageCode);
        logMessage = `✅ Language changed to '${languageCode}' (preference saved to database).`;
      } catch (error) {
        logMessage = `⚠️ Language changed to '${languageCode}', but failed to save to database. Will use local preference.`;
        console.error('Failed to save language to database:', error);
      }
    }
    
    console.log(logMessage);
  }
} 