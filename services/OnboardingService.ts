import AsyncStorage from '@react-native-async-storage/async-storage';

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