import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './supabaseClient';
import dayjs from 'dayjs';

const ONBOARDING_COMPLETED_KEY = 'onboarding_completed';

export class OnboardingService {
  /**
   * Marks onboarding as completed
   */
  static async markOnboardingAsCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }

  /**
   * Checks if onboarding has been completed
   */
  static async hasCompletedOnboarding(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      return false;
    }
  }

  /**
   * Resets onboarding status (for testing)
   */
  static async resetOnboardingStatus(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);
    } catch (error) {
      console.error('Error resetting onboarding status:', error);
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

  const payload = {
    p_user_id: userId,
    p_age_group: data.age_group,
    p_brushing_target: data.brushing_target,
    p_toothbrush_start_date: data.toothbrush_start_date
      ? dayjs(data.toothbrush_start_date).format('YYYY-MM-DD')
      : null,
    p_mascot_tone: data.mascot_tone,
  };

  const { error } = await supabase.rpc('update_user_onboarding_details', payload);

  // If Supabase returns an error, we throw it to be caught by our UI.
  if (error) {
    console.error('Supabase onboarding update error (RPC):', error);
    throw new Error(error.message || 'Failed to save onboarding data.');
  }

  // If there's no error, the operation was successful.
  return;
} 