import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, format } from 'date-fns';

const APP_INSTALL_DATE_KEY = 'app_install_date';
const APP_FIRST_LAUNCH_KEY = 'app_first_launch_recorded';

export interface AppInstallStats {
  installDate: Date;
  daysSinceInstall: number;
  isFirstWeek: boolean;
  installDateString: string; // YYYY-MM-DD format
}

/**
 * Service for tracking app installation date and calculating milestones
 * Handles first launch detection and persistent storage
 */
export class AppInstallService {

  /**
   * Initialize the app install tracking (call this on app startup)
   */
  static async initializeInstallTracking(): Promise<void> {
    try {
      // Check if we've already recorded the first launch
      const firstLaunchRecorded = await AsyncStorage.getItem(APP_FIRST_LAUNCH_KEY);
      
      if (!firstLaunchRecorded) {
        // This is the first launch - record the install date
        const now = new Date();
        await AsyncStorage.setItem(APP_INSTALL_DATE_KEY, now.toISOString());
        await AsyncStorage.setItem(APP_FIRST_LAUNCH_KEY, 'true');
        
        console.log('📱 First app launch detected, install date recorded:', format(now, 'yyyy-MM-dd'));
      } else {
        // App has been launched before, install date should already be stored
        const installDate = await AsyncStorage.getItem(APP_INSTALL_DATE_KEY);
        if (installDate) {
          console.log('📱 App install date already tracked:', format(new Date(installDate), 'yyyy-MM-dd'));
        } else {
          // Fallback: if first launch was recorded but install date is missing
          console.warn('⚠️ First launch was recorded but install date missing, setting to now');
          await AsyncStorage.setItem(APP_INSTALL_DATE_KEY, new Date().toISOString());
        }
      }
    } catch (error) {
      console.error('❌ Error initializing install tracking:', error);
    }
  }

  /**
   * Get the app install date
   */
  static async getInstallDate(): Promise<Date | null> {
    try {
      const installDateString = await AsyncStorage.getItem(APP_INSTALL_DATE_KEY);
      if (!installDateString) {
        return null;
      }
      return new Date(installDateString);
    } catch (error) {
      console.error('❌ Error getting install date:', error);
      return null;
    }
  }

  /**
   * Get days since app was installed
   */
  static async getDaysSinceInstall(): Promise<number> {
    try {
      const installDate = await this.getInstallDate();
      if (!installDate) {
        console.warn('⚠️ Install date not found, returning 0');
        return 0;
      }

      const daysSince = differenceInDays(new Date(), installDate);
      console.log(`📱 Days since install: ${daysSince}`);
      return daysSince;
    } catch (error) {
      console.error('❌ Error calculating days since install:', error);
      return 0;
    }
  }

  /**
   * Check if it's been exactly N days since install
   */
  static async isExactDaysSinceInstall(targetDays: number): Promise<boolean> {
    const daysSince = await this.getDaysSinceInstall();
    return daysSince === targetDays;
  }

  /**
   * Get comprehensive install statistics
   */
  static async getInstallStats(): Promise<AppInstallStats | null> {
    try {
      const installDate = await this.getInstallDate();
      if (!installDate) {
        return null;
      }

      const daysSinceInstall = differenceInDays(new Date(), installDate);
      const isFirstWeek = daysSinceInstall <= 7;

      return {
        installDate,
        daysSinceInstall,
        isFirstWeek,
        installDateString: format(installDate, 'yyyy-MM-dd'),
      };
    } catch (error) {
      console.error('❌ Error getting install stats:', error);
      return null;
    }
  }

  /**
   * Check if user is in their first week (0-7 days)
   */
  static async isFirstWeek(): Promise<boolean> {
    const daysSince = await this.getDaysSinceInstall();
    return daysSince <= 7;
  }

  /**
   * Get milestone status for various day targets
   */
  static async getMilestoneStatus(): Promise<{
    day1: boolean;
    day3: boolean;
    day7: boolean;
    day14: boolean;
    day30: boolean;
    currentDay: number;
  }> {
    const daysSince = await this.getDaysSinceInstall();
    
    return {
      day1: daysSince === 1,
      day3: daysSince === 3,
      day7: daysSince === 7,
      day14: daysSince === 14,
      day30: daysSince === 30,
      currentDay: daysSince,
    };
  }

  /**
   * Reset install tracking (for testing purposes only)
   */
  static async resetInstallTracking(): Promise<void> {
    try {
      await AsyncStorage.removeItem(APP_INSTALL_DATE_KEY);
      await AsyncStorage.removeItem(APP_FIRST_LAUNCH_KEY);
      console.log('🔄 Install tracking reset');
    } catch (error) {
      console.error('❌ Error resetting install tracking:', error);
    }
  }
} 