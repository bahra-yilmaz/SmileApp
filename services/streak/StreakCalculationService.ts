import { calculateStreak, getStreakStatus, StreakStatus } from '../../utils/streakUtils';
import { getTodayHabitString } from '../../utils/dateUtils';
import { StreakDataService } from './StreakDataService';
import { STREAK_CONFIG } from './StreakConfig';
import { 
  StreakData, 
  StreakHistory, 
  StreakPeriod, 
  StreakSession,
  DailyGoalStatus,
  ComprehensiveStreakData 
} from './StreakTypes';

/**
 * Handles all streak calculation logic and business rules
 */
export class StreakCalculationService {

  /**
   * Calculate current streak for a user
   */
  static async calculateCurrentStreak(
    userId: string, 
    includeToday: boolean = true
  ): Promise<StreakData> {
    try {
      const dailyTarget = await StreakDataService.getUserDailyTarget();
      
      // Get sessions from the last 30 days for calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessions = await StreakDataService.fetchBrushingSessions(userId, thirtyDaysAgo);
      
      // Calculate current streak using existing utility
      const currentStreak = calculateStreak(sessions, dailyTarget);
      
      // For longest streak, use cached value or current as minimum
      const cachedData = StreakDataService.getCachedStreakData(userId);
      const longestStreak = Math.max(currentStreak, cachedData?.longestStreak ?? 0);

      return {
        currentStreak,
        longestStreak,
        lastCalculated: Date.now(),
        userId,
        aimedSessionsPerDay: dailyTarget
      };
    } catch (error) {
      console.error('Error calculating current streak:', error);
      return this.getDefaultStreakData(userId);
    }
  }

  /**
   * Calculate total brushing sessions in current streak period
   */
  static async calculateCurrentStreakBrushings(
    userId: string, 
    currentStreak: number
  ): Promise<number> {
    if (currentStreak === 0) {
      return 0;
    }
    
    try {
      // Calculate the start date of the current streak - use START OF DAY!
      const today = new Date();
      const streakStartDate = new Date(today);
      streakStartDate.setDate(today.getDate() - currentStreak + 1);
      
      // Set to start of day (00:00:00.000) to capture all sessions from that day
      streakStartDate.setHours(0, 0, 0, 0);
      
      // Fetch sessions in the current streak period
      const sessions = await StreakDataService.fetchBrushingSessions(userId, streakStartDate);
      
      return sessions.length;
    } catch (error) {
      console.error('Error calculating current streak brushings:', error);
      
      // Fallback: estimate based on streak days and daily target
      const dailyTarget = await StreakDataService.getUserDailyTarget();
      return currentStreak * dailyTarget;
    }
  }

  /**
   * Calculate streak history (periods of consecutive days)
   */
  static async calculateStreakHistory(userId: string): Promise<StreakHistory> {
    try {
      // Check cache first
      const cachedHistory = StreakDataService.getCachedHistoryData();
      if (cachedHistory) {
        return cachedHistory;
      }

      // For now, return a simplified history with current streak
      // In a full implementation, this would analyze all historical data
      // to find all streak periods
      const currentStreakData = await this.calculateCurrentStreak(userId);
      
      const periods: StreakPeriod[] = [];
      
      if (currentStreakData.currentStreak > 0) {
        const today = getTodayHabitString();
        const streakStart = new Date();
        streakStart.setDate(streakStart.getDate() - currentStreakData.currentStreak + 1);
        
        periods.push({
          id: 'current',
          startDate: streakStart.toISOString().slice(0, 10),
          endDate: today,
          duration: currentStreakData.currentStreak
        });
      }

      const history: StreakHistory = {
        periods: periods.filter(p => p.duration > 0),
        lastUpdated: Date.now()
      };

      // Cache the result
      await StreakDataService.cacheHistoryData(history);
      
      return history;
    } catch (error) {
      console.error('Error calculating streak history:', error);
      return {
        periods: [],
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Check daily goal status for today
   */
  static async checkDailyGoalStatus(userId: string): Promise<DailyGoalStatus> {
    try {
      const requiredSessions = await StreakDataService.getUserDailyTarget();
      const todaySessions = await StreakDataService.fetchTodaysSessions(userId);
      const sessionsToday = todaySessions.length;
      
      return {
        hitGoalToday: sessionsToday >= requiredSessions,
        sessionsToday,
        requiredSessions,
        remainingSessions: Math.max(0, requiredSessions - sessionsToday)
      };
    } catch (error) {
      console.error('Error checking daily goal status:', error);
      const defaultTarget = STREAK_CONFIG.DEFAULTS.DAILY_BRUSHING_TARGET;
      return {
        hitGoalToday: false,
        sessionsToday: 0,
        requiredSessions: defaultTarget,
        remainingSessions: defaultTarget
      };
    }
  }

  /**
   * Get comprehensive streak data including all metrics
   */
  static async getComprehensiveStreakData(
    userId: string, 
    forceRefresh: boolean = false
  ): Promise<ComprehensiveStreakData> {
    try {
      // Try cache first unless force refresh
      if (!forceRefresh) {
        const cachedStreak = StreakDataService.getCachedStreakData(userId);
        const cachedHistory = StreakDataService.getCachedHistoryData();
        
        if (cachedStreak && cachedHistory) {
          const currentStreakBrushings = await this.calculateCurrentStreakBrushings(
            userId, 
            cachedStreak.currentStreak
          );
          
          return {
            currentStreak: cachedStreak.currentStreak,
            longestStreak: cachedStreak.longestStreak,
            streakHistory: cachedHistory.periods,
            currentStreakBrushings,
            lastUpdated: Math.min(cachedStreak.lastCalculated, cachedHistory.lastUpdated)
          };
        }
      }

      // Calculate fresh data
      const [streakData, historyData] = await Promise.all([
        this.calculateCurrentStreak(userId),
        this.calculateStreakHistory(userId)
      ]);

      const currentStreakBrushings = await this.calculateCurrentStreakBrushings(
        userId, 
        streakData.currentStreak
      );

      // Cache the results
      await Promise.all([
        StreakDataService.cacheStreakData(streakData),
        StreakDataService.cacheHistoryData(historyData)
      ]);

      return {
        currentStreak: streakData.currentStreak,
        longestStreak: streakData.longestStreak,
        streakHistory: historyData.periods,
        currentStreakBrushings,
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error getting comprehensive streak data:', error);
      
      // Return safe defaults
      return {
        currentStreak: 0,
        longestStreak: 0,
        streakHistory: [],
        currentStreakBrushings: 0,
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Calculate progress towards next milestone
   */
  static calculateMilestoneProgress(currentStreak: number): {
    currentPhase: number;
    nextMilestone: number;
    progress: number;
    progressPercentage: number;
  } {
    const phaseLength = STREAK_CONFIG.DEFAULTS.STREAK_PHASE_LENGTH;
    const currentPhase = currentStreak % phaseLength;
    const nextMilestone = Math.ceil((currentStreak + 1) / phaseLength) * phaseLength;
    const progress = currentPhase;
    const progressPercentage = Math.min(100, Math.round((progress / phaseLength) * 100));

    return {
      currentPhase,
      nextMilestone,
      progress,
      progressPercentage
    };
  }

  /**
   * Get enhanced streak status with current day progress
   */
  static async getStreakStatus(userId: string): Promise<StreakStatus> {
    try {
      const dailyTarget = await StreakDataService.getUserDailyTarget();
      
      // Get sessions from the last 30 days for calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const sessions = await StreakDataService.fetchBrushingSessions(userId, thirtyDaysAgo);
      
      return getStreakStatus(sessions, dailyTarget);
    } catch (error) {
      console.error('Error getting streak status:', error);
      
      // Return safe defaults
      const defaultTarget = STREAK_CONFIG.DEFAULTS.DAILY_BRUSHING_TARGET;
      return {
        currentStreak: 0,
        streakIncludingToday: 0,
        todaySessionsCount: 0,
        todaySessionsNeeded: defaultTarget,
        todayCompleted: false,
        isStreakContinuing: false
      };
    }
  }

  // Private helper methods

  private static getDefaultStreakData(userId: string): StreakData {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastCalculated: Date.now(),
      userId,
      aimedSessionsPerDay: STREAK_CONFIG.DEFAULTS.DAILY_BRUSHING_TARGET
    };
  }
} 