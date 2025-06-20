import supabase from './supabaseClient';
import dayjs from 'dayjs';

export class OnboardingService {
  /**
   * Determines if the onboarding (language selection) has been completed by
   * checking whether the `language` column in the current user row is set.
   */
  static async hasCompletedOnboarding(userId: string | undefined | null): Promise<boolean> {
    if (!userId) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('language')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Supabase error fetching user language:', error);
        return false;
      }

      return !!data?.language;
    } catch (error) {
      console.error('Failed to check onboarding completion:', error);
      return false;
    }
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
  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', userId);

  if (error) {
    console.error('❌ Supabase onboarding update error:', error);
    throw new Error(error.message || 'Failed to save onboarding data.');
  }

  console.log('✅ Onboarding data updated successfully');
  return;
} 