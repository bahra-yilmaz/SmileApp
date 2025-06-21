import supabase from './supabaseClient';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGE_STORAGE_KEY = 'user_language_preference';

export class OnboardingService {
  /**
   * Determines if the onboarding (language selection) has been completed by
   * checking whether the `language` column in the current user row is set.
   */
  static async hasCompletedOnboarding(userId: string | undefined | null): Promise<boolean> {
    console.log('🔍 OnboardingService: hasCompletedOnboarding called with userId:', userId);
    
    if (!userId) {
      console.log('🔍 OnboardingService: No userId provided, returning false');
      return false;
    }

    try {
      console.log('🔍 OnboardingService: Querying database for user language...');
      
      // Create a timeout promise that rejects after 5 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database query timeout')), 5000);
      });
      
      // Race the query against the timeout
      const queryPromise = supabase
        .from('users')
        .select('language')
        .eq('id', userId)
        .maybeSingle();
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log('🔍 OnboardingService: Database query result:', { data, error });

      if (error) {
        console.error('❌ Supabase error fetching user language:', error);
        // If it's an RLS error, assume onboarding is not completed
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          console.warn('⚠️ RLS permission issue detected - assuming onboarding not completed');
          return false;
        }
        return false;
      }

      const isCompleted = !!data?.language;
      console.log('🔍 OnboardingService: Onboarding completed:', isCompleted, 'Language:', data?.language);
      return isCompleted;
    } catch (error) {
      console.error('❌ Failed to check onboarding completion:', error);
      
      // If timeout or RLS issue, check local storage as fallback
      if (error instanceof Error && error.message.includes('timeout')) {
        console.warn('⚠️ Database timeout - checking local storage as fallback');
        return await this.checkLocalLanguagePreference();
      }
      
      return false;
    }
  }

  /**
   * Checks if user has a language preference in local storage
   */
  private static async checkLocalLanguagePreference(): Promise<boolean> {
    try {
      const localLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      
      // If we have a language preference stored locally, consider onboarding complete
      const hasLanguagePreference = !!localLanguage;
      console.log('🔍 Local language preference exists:', hasLanguagePreference);
      
      return hasLanguagePreference;
    } catch (error) {
      console.error('❌ Failed to check local language preference:', error);
      return false;
    }
  }

  /**
   * Enhanced onboarding completion check that considers both database and local storage
   */
  static async hasCompletedOnboardingEnhanced(userId: string | undefined | null): Promise<boolean> {
    console.log('🔍 OnboardingService: Enhanced onboarding check for userId:', userId);

    // For authenticated users, try database first, then local storage
    if (userId) {
      try {
        // Try database first with timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Database query timeout')), 3000);
        });
        
        const queryPromise = supabase
          .from('users')
          .select('language')
          .eq('id', userId)
          .maybeSingle();
        
        const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

        if (!error && data?.language) {
          console.log('✅ Database language found:', data.language);
          return true;
        }

        console.log('⚠️ No database language, checking local storage...');
      } catch (dbError) {
        console.warn('⚠️ Database check failed, trying local storage:', dbError);
      }
    }

    // Check local storage for language preference (works for both guests and authenticated users)
    return await this.checkLocalLanguagePreference();
  }

  /**
   * Persists the selected language on the backend.
   */
  static async setUserLanguage(userId: string, languageCode: string): Promise<void> {
    if (!userId) throw new Error('Missing user ID for setUserLanguage');

    try {
      const { error } = await supabase
        .from('users')
        .update({ language: languageCode })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user language:', error);
      throw error;
    }
  }

  /**
   * Dev helper – clears the language so onboarding shows again.
   */
  static async resetOnboardingStatus(userId: string): Promise<void> {
    if (!userId) throw new Error('Missing user ID for reset');

    try {
      const { error } = await supabase
        .from('users')
        .update({ language: null })
        .eq('id', userId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to reset onboarding status:', error);
      throw error;
    }
  }

  /**
   * @deprecated Existing onboarding screens call this. It now just ensures the
   *              language column is set so the app won\'t show onboarding again.
   */
  static async markOnboardingAsCompleted(userId?: string, languageCode?: string): Promise<void> {
    if (!userId) return;

    // If a language code is provided, set it. Otherwise leave as-is.
    if (languageCode) {
      await OnboardingService.setUserLanguage(userId, languageCode);
    }
  }

  /**
   * Fetches the user's current brushing target time from the database.
   * @param userId The ID of the user.
   * @returns The target time in seconds, or a default of 120 if not set.
   */
  static async getBrushingTarget(userId: string): Promise<number> {
    if (!userId) {
      console.warn('⚠️ No user ID provided to getBrushingTarget, returning default.');
      return 120; // Default to 2 minutes
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('target_time_in_sec')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching brushing target:', error);
        // Return default if record doesn't exist or another error occurs
        return 120;
      }

      // data.target_time_in_sec can be null, so we provide a default
      return data?.target_time_in_sec ?? 120;
    } catch (err) {
      console.error('❌ Exception in getBrushingTarget:', err);
      return 120; // Default on exception
    }
  }

  /**
   * Updates the user's brushing target time.
   * @param userId The ID of the user.
   * @param targetInSeconds The new target time in seconds.
   */
  static async updateBrushingTarget(userId: string, targetInSeconds: number): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required to update brushing target.');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ target_time_in_sec: targetInSeconds })
        .eq('id', userId);

      if (error) {
        throw error;
      }
      
      console.log('✅ Brushing target updated successfully to', targetInSeconds);
    } catch (err) {
      console.error('❌ Failed to update brushing target:', err);
      throw err;
    }
  }

  /**
   * Fetches the user's daily brushing frequency from the database.
   * @param userId The ID of the user.
   * @returns The number of sessions per day, or a default of 2.
   */
  static async getBrushingFrequency(userId: string): Promise<number> {
    if (!userId) {
      console.warn('⚠️ No user ID provided to getBrushingFrequency, returning default.');
      return 2; // Default to 2 sessions
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('brushing_target')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching brushing frequency:', error);
        return 2;
      }

      return data?.brushing_target ?? 2;
    } catch (err) {
      console.error('❌ Exception in getBrushingFrequency:', err);
      return 2;
    }
  }

  /**
   * Updates the user's daily brushing frequency.
   * @param userId The ID of the user.
   * @param frequency The new number of sessions per day.
   */
  static async updateBrushingFrequency(userId: string, frequency: number): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required to update brushing frequency.');
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ brushing_target: frequency })
        .eq('id', userId);

      if (error) {
        throw error;
      }
      
      console.log('✅ Brushing frequency updated successfully to', frequency);
    } catch (err) {
      console.error('❌ Failed to update brushing frequency:', err);
      throw err;
    }
  }
}

interface OnboardingPayload {
  age_group?: number;
  brushing_target?: number;
  toothbrush_start_date?: string | null;
  mascot_tone?: string;
}

/**
 * Updates the user's record in the 'users' table with their onboarding data.
 * @param userId The ID of the user to update.
 * @param data The onboarding data to save.
 */
export async function updateUserOnboarding(userId: string, data: OnboardingPayload): Promise<void> {
  if (!userId) {
    throw new Error('User ID is required to update onboarding data.');
  }

  // Prepare update payload with proper date formatting
  const updatePayload = {
    age_group: data.age_group,
    brushing_target: data.brushing_target,
    toothbrush_start_date: data.toothbrush_start_date
      ? dayjs(data.toothbrush_start_date).format('YYYY-MM-DD')
      : null,
    mascot_tone: data.mascot_tone,
  };

  console.log('🔄 Updating user onboarding data:', { userId, updatePayload });

  // Use direct update instead of RPC to ensure it works
  const { error, count } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', userId);

  if (error) {
    console.error('❌ Supabase onboarding update error:', error);
    throw new Error(error.message || 'Failed to save onboarding data.');
  }

  console.log('✅ Onboarding data updated successfully. Rows affected:', count);

  // Verify the update worked by fetching the record
  const { data: verifyData, error: verifyError } = await supabase
    .from('users')
    .select('age_group, brushing_target, toothbrush_start_date, mascot_tone, target_time_in_sec')
    .eq('id', userId)
    .single();

  if (verifyError) {
    console.error('❌ Error verifying onboarding update:', verifyError);
  } else {
    console.log('🔍 Verification - User record after update:', verifyData);
  }

  return;
} 