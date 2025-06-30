import { MonthlyBrushService } from './MonthlyBrushService';
import { AppInstallService } from './AppInstallService';
import { BestStreakService } from './BestStreakService';

export interface MilestoneContext {
  // Monthly brushing data
  monthlyBrushCount: number;
  
  // App install tracking
  daysSinceInstall: number;
  
  // Best streak tracking
  previousBestStreak: number;
  currentVsBest: {
    current: number;
    previousBest: number;
    isNewRecord: boolean;
    improvement: number;
  };
}

export interface MilestoneState {
  // Brush count milestones
  hasReached10Brushes: boolean;
  hasReached20MonthlyBrushes: boolean;
  
  // Install date milestones
  isDay7: boolean;
  
  // Streak milestones
  isNewBestStreak: boolean;
  
  // Days since break (for returning user detection)
  daysSinceLastBrush: number;
}

/**
 * Main service for coordinating all milestone-related functionality
 * Provides unified interface for milestone detection and context
 */
export class MilestoneService {

  /**
   * Initialize all milestone services (call this on app startup)
   */
  static async initialize(): Promise<void> {
    try {
      // Initialize install tracking
      await AppInstallService.initializeInstallTracking();
      console.log('✅ Milestone services initialized');
    } catch (error) {
      console.error('❌ Error initializing milestone services:', error);
    }
  }

  /**
   * Get comprehensive milestone context for a user
   */
  static async getMilestoneContext(userId: string): Promise<MilestoneContext> {
    try {
      // Run all data fetching in parallel for efficiency
      const [
        monthlyBrushCount,
        daysSinceInstall,
        previousBestStreak,
        currentVsBest
      ] = await Promise.all([
        MonthlyBrushService.getCurrentMonthBrushCount(userId),
        AppInstallService.getDaysSinceInstall(),
        BestStreakService.getBestStreak(userId),
        // We'll need current streak for comparison - using 0 as placeholder
        BestStreakService.compareWithBest(userId, 0)
      ]);

      return {
        monthlyBrushCount,
        daysSinceInstall,
        previousBestStreak,
        currentVsBest,
      };
    } catch (error) {
      console.error('❌ Error getting milestone context:', error);
      return {
        monthlyBrushCount: 0,
        daysSinceInstall: 0,
        previousBestStreak: 0,
        currentVsBest: {
          current: 0,
          previousBest: 0,
          isNewRecord: false,
          improvement: 0,
        },
      };
    }
  }

  /**
   * Check milestone states for category detection
   */
  static async getMilestoneState(
    userId: string, 
    currentStreak: number,
    totalBrushCount: number,
    lastBrushDate?: Date
  ): Promise<MilestoneState> {
    try {
      const [
        monthlyBrushCount,
        daysSinceInstall,
        bestStreakComparison
      ] = await Promise.all([
        MonthlyBrushService.getCurrentMonthBrushCount(userId),
        AppInstallService.getDaysSinceInstall(),
        BestStreakService.compareWithBest(userId, currentStreak)
      ]);

      // Calculate days since last brush
      let daysSinceLastBrush = 0;
      if (lastBrushDate) {
        const daysSince = Math.floor((Date.now() - lastBrushDate.getTime()) / (1000 * 60 * 60 * 24));
        daysSinceLastBrush = daysSince;
      }

      return {
        // Brush count milestones
        hasReached10Brushes: totalBrushCount >= 10,
        hasReached20MonthlyBrushes: monthlyBrushCount >= 20,
        
        // Install date milestones
        isDay7: daysSinceInstall === 7,
        
        // Streak milestones
        isNewBestStreak: bestStreakComparison.isNewRecord && currentStreak >= 2,
        
        // Days since break
        daysSinceLastBrush,
      };
    } catch (error) {
      console.error('❌ Error getting milestone state:', error);
      return {
        hasReached10Brushes: false,
        hasReached20MonthlyBrushes: false,
        isDay7: false,
        isNewBestStreak: false,
        daysSinceLastBrush: 0,
      };
    }
  }

  /**
   * Update best streak when user completes a brushing session
   */
  static async updateBestStreakProgress(userId: string, currentStreak: number): Promise<void> {
    try {
      const result = await BestStreakService.updateBestStreakIfBetter(userId, currentStreak);
      
      if (result.isNewRecord) {
        console.log(`🎉 New personal record: ${currentStreak} days!`);
        // Could trigger additional celebrations or notifications here
      }
    } catch (error) {
      console.error('❌ Error updating best streak progress:', error);
    }
  }

  /**
   * Get detailed milestone progress for dashboard/stats display
   */
  static async getMilestoneProgress(userId: string): Promise<{
    monthly: {
      current: number;
      target: number;
      percentage: number;
    };
    bestStreak: {
      best: number;
      hasReached7Days: boolean;
      hasReached14Days: boolean;
      hasReached30Days: boolean;
    };
    installTracking: {
      daysSinceInstall: number;
      isFirstWeek: boolean;
    };
  }> {
    try {
      const [
        monthlyProgress,
        bestStreakAchievements,
        installStats
      ] = await Promise.all([
        MonthlyBrushService.getMonthlyProgress(userId, 60), // 60 brushes per month target
        BestStreakService.getBestStreakAchievements(userId),
        AppInstallService.getInstallStats()
      ]);

      return {
        monthly: monthlyProgress,
        bestStreak: bestStreakAchievements,
        installTracking: {
          daysSinceInstall: installStats?.daysSinceInstall || 0,
          isFirstWeek: installStats?.isFirstWeek || false,
        },
      };
    } catch (error) {
      console.error('❌ Error getting milestone progress:', error);
      return {
        monthly: { current: 0, target: 60, percentage: 0 },
        bestStreak: { best: 0, hasReached7Days: false, hasReached14Days: false, hasReached30Days: false },
        installTracking: { daysSinceInstall: 0, isFirstWeek: false },
      };
    }
  }

  /**
   * Check if user qualifies for "returning user" milestone
   */
  static async checkReturningUserMilestone(lastBrushDate?: Date): Promise<boolean> {
    if (!lastBrushDate) {
      return false;
    }

    const daysSince = Math.floor((Date.now() - lastBrushDate.getTime()) / (1000 * 60 * 60 * 24));
    const isReturningUser = daysSince >= 5; // 5+ days away qualifies as "returning"
    
    if (isReturningUser) {
      console.log(`🔄 Returning user milestone: ${daysSince} days since last brush`);
    }
    
    return isReturningUser;
  }

  /**
   * Reset all milestone data (for testing purposes)
   */
  static async resetAllMilestones(userId: string): Promise<void> {
    try {
      await Promise.all([
        AppInstallService.resetInstallTracking(),
        BestStreakService.resetBestStreak(userId)
      ]);
      console.log('🔄 All milestone data reset');
    } catch (error) {
      console.error('❌ Error resetting milestone data:', error);
    }
  }
} 