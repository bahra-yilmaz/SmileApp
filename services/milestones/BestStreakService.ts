import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { GuestUserService } from '../GuestUserService';

const BEST_STREAK_KEY = 'user_best_streak';
const GUEST_BEST_STREAK_KEY = 'guest_best_streak';

export interface BestStreakData {
  bestStreak: number;
  achievedDate: string; // ISO date string
  currentStreak: number;
  isNewRecord: boolean;
}

export interface StreakComparison {
  current: number;
  previousBest: number;
  isNewRecord: boolean;
  improvement: number; // How many days better than previous best
}

/**
 * Service for tracking and managing best streak achievements
 * Handles both authenticated users (database) and guest users (AsyncStorage)
 */
export class BestStreakService {

  /**
   * Get the user's best streak
   */
  static async getBestStreak(userId: string): Promise<number> {
    try {
      // Handle guest users
      if (userId === 'guest') {
        return await this.getGuestBestStreak();
      }

      // For authenticated users, calculate from brushing logs
      // Note: We calculate from history since best_streak column doesn't exist in users table
      const calculatedBest = await this.calculateBestStreakFromHistory(userId);
      console.log(`📊 Calculated best streak for user ${userId}: ${calculatedBest} days`);
      
      return calculatedBest;
    } catch (error) {
      console.error('❌ Error in getBestStreak:', error);
      return 0;
    }
  }

  /**
   * Update the user's best streak if current streak is better
   */
  static async updateBestStreakIfBetter(userId: string, currentStreak: number): Promise<BestStreakData> {
    try {
      const previousBest = await this.getBestStreak(userId);
      const isNewRecord = currentStreak > previousBest;

      if (isNewRecord) {
        await this.updateBestStreak(userId, currentStreak);
        console.log(`🏆 New streak record! ${currentStreak} days (previous: ${previousBest})`);
      }

      return {
        bestStreak: Math.max(currentStreak, previousBest),
        achievedDate: new Date().toISOString(),
        currentStreak,
        isNewRecord,
      };
    } catch (error) {
      console.error('❌ Error updating best streak:', error);
      return {
        bestStreak: 0,
        achievedDate: new Date().toISOString(),
        currentStreak: 0,
        isNewRecord: false,
      };
    }
  }

  /**
   * Force update the best streak value (only for guest users via local storage)
   */
  private static async updateBestStreak(userId: string, newBestStreak: number): Promise<void> {
    try {
      if (userId === 'guest') {
        await AsyncStorage.setItem(GUEST_BEST_STREAK_KEY, newBestStreak.toString());
        console.log(`👻 Updated guest best streak: ${newBestStreak}`);
        return;
      }

      // For authenticated users, we don't store best_streak in database since columns don't exist
      // The best streak is calculated dynamically from brushing_logs when needed
      console.log(`📊 Best streak for authenticated user ${userId}: ${newBestStreak} (calculated from history)`);
    } catch (error) {
      console.error('❌ Error in updateBestStreak:', error);
    }
  }

  /**
   * Get guest user's best streak from AsyncStorage
   */
  private static async getGuestBestStreak(): Promise<number> {
    try {
      const bestStreakString = await AsyncStorage.getItem(GUEST_BEST_STREAK_KEY);
      if (!bestStreakString) {
        // If no stored best streak, calculate from guest data
        const guestUserId = await GuestUserService.getCurrentGuestUserId();
        if (guestUserId) {
          return await this.calculateBestStreakFromHistory(guestUserId);
        }
        return 0;
      }
      
      const bestStreak = parseInt(bestStreakString, 10);
      console.log(`👻 Guest best streak: ${bestStreak}`);
      return bestStreak;
    } catch (error) {
      console.error('❌ Error getting guest best streak:', error);
      return 0;
    }
  }

  /**
   * Calculate best streak from historical brushing data
   */
  private static async calculateBestStreakFromHistory(userId: string): Promise<number> {
    try {
      // Get all brushing logs ordered by date
      const { data: logs, error } = await supabase
        .from('brushing_logs')
        .select('date')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching brushing history:', error);
        return 0;
      }

      if (!logs || logs.length === 0) {
        return 0;
      }

      // Calculate longest streak from the data
      const uniqueDates = [...new Set(logs.map(log => log.date))].sort();
      let bestStreak = 0;
      let currentStreak = 1;

      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          // Consecutive day
          currentStreak++;
        } else {
          // Gap in streak, record the current streak if it's the best
          bestStreak = Math.max(bestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      // Don't forget to check the final streak
      bestStreak = Math.max(bestStreak, currentStreak);
      
      console.log(`📊 Calculated best streak from history: ${bestStreak} days`);
      return bestStreak;
    } catch (error) {
      console.error('❌ Error calculating best streak from history:', error);
      return 0;
    }
  }

  /**
   * Compare current streak with best streak
   */
  static async compareWithBest(userId: string, currentStreak: number): Promise<StreakComparison> {
    try {
      const previousBest = await this.getBestStreak(userId);
      const isNewRecord = currentStreak > previousBest;
      const improvement = Math.max(0, currentStreak - previousBest);

      return {
        current: currentStreak,
        previousBest,
        isNewRecord,
        improvement,
      };
    } catch (error) {
      console.error('❌ Error comparing streaks:', error);
      return {
        current: currentStreak,
        previousBest: 0,
        isNewRecord: false,
        improvement: 0,
      };
    }
  }

  /**
   * Check if current streak has reached or exceeded personal best
   */
  static async hasReachedNewRecord(userId: string, currentStreak: number): Promise<boolean> {
    const comparison = await this.compareWithBest(userId, currentStreak);
    return comparison.isNewRecord;
  }

  /**
   * Get achievement status for best streak milestones
   */
  static async getBestStreakAchievements(userId: string): Promise<{
    best: number;
    hasReached7Days: boolean;
    hasReached14Days: boolean;
    hasReached30Days: boolean;
    hasReached100Days: boolean;
  }> {
    const bestStreak = await this.getBestStreak(userId);
    
    return {
      best: bestStreak,
      hasReached7Days: bestStreak >= 7,
      hasReached14Days: bestStreak >= 14,
      hasReached30Days: bestStreak >= 30,
      hasReached100Days: bestStreak >= 100,
    };
  }

  /**
   * Reset best streak (for testing purposes)
   */
  static async resetBestStreak(userId: string): Promise<void> {
    try {
      if (userId === 'guest') {
        await AsyncStorage.removeItem(GUEST_BEST_STREAK_KEY);
        console.log('🔄 Guest best streak reset');
        return;
      }

      // For authenticated users, best streak is calculated from brushing_logs
      // To "reset" it, we would need to delete brushing log entries
      // For now, just log that reset was requested (this is mainly for testing)
      console.log('🔄 Best streak reset requested for authenticated user (calculated from history)');
    } catch (error) {
      console.error('❌ Error in resetBestStreak:', error);
    }
  }
} 