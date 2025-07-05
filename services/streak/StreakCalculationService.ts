import { calculateStreak, getStreakStatus, StreakStatus } from '../../utils/streakUtils';
import { getTodayHabitString, getHabitDayString, HABIT_DAY_CONFIG } from '../../utils/dateUtils';
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
      // -------------------------------------------------------------
      // Determine whether TODAY is already counted in the streak.
      // If today's brushing goal isn't met yet, we must NOT include
      // today's sessions in the count window.
      // -------------------------------------------------------------

      const dailyTarget = await StreakDataService.getUserDailyTarget();
      const todaySessions = await StreakDataService.fetchTodaysSessions(userId);
      const todayCompleted = todaySessions.length >= dailyTarget;

      // Identify today's habit-day (same calendar date string used elsewhere).
      const todayHabit = getTodayHabitString();

      // Convert the YYYY-MM-DD habit-day to a Date (00:00 local).
      const startHabitDate = new Date(todayHabit);

      // Offset calculation:
      //   • If today counts, we need (currentStreak - 1) earlier days.
      //   • If today DOESN'T count, we need currentStreak earlier days
      //     (because the streak begins yesterday).
      const offsetDays = todayCompleted ? currentStreak - 1 : currentStreak;
      startHabitDate.setDate(startHabitDate.getDate() - offsetDays);

      // Position the start boundary to the reset hour (3:00 AM).
      startHabitDate.setHours(
        HABIT_DAY_CONFIG.RESET_HOUR,
        0,
        0,
        0
      );

      // Fetch sessions in the streak window (inclusive of boundary).
      const sessions = await StreakDataService.fetchBrushingSessions(
        userId,
        startHabitDate
      );
      
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
      // 1) Check cache first
      const cachedHistory = StreakDataService.getCachedHistoryData();
      if (cachedHistory) return cachedHistory;

      // 2) Prep lookup data
      const dailyTarget = await StreakDataService.getUserDailyTarget();

      // We'll look back up to a year – adjust if performance dictates
      const lookbackDays = 365;
      const startLookupDate = new Date();
      startLookupDate.setDate(startLookupDate.getDate() - lookbackDays);

      const sessions = await StreakDataService.fetchBrushingSessions(
        userId,
        startLookupDate
      );

      // 3) Group sessions by habit-day → count
      const countsByDay = new Map<string, number>();
      sessions.forEach(s => {
        // Prefer explicit habit-day `date` field. Otherwise derive it from created_at
        const dayKey = s.date
          ? s.date
          : s.created_at
          ? getHabitDayString(new Date(s.created_at))
          : '';
        if (!dayKey) return;
        const count = countsByDay.get(dayKey) ?? 0;
        countsByDay.set(dayKey, count + 1);
      });

      // 4) Iterate over every habit-day from (lookback) → today inclusive,
      //    identifying consecutive successful streak periods.
      const periods: StreakPeriod[] = [];
      let currentStart: Date | null = null;
      let currentLength = 0;

      const today = new Date();
      // Align both today and the scanning cursor to the habit-day reset hour (e.g. 03:00).
      today.setHours(HABIT_DAY_CONFIG.RESET_HOUR, 0, 0, 0);

      const cursor = new Date(startLookupDate);
      cursor.setHours(HABIT_DAY_CONFIG.RESET_HOUR, 0, 0, 0);

      while (cursor <= today) {
        const dayStr = getHabitDayString(cursor);
        const brushCount = countsByDay.get(dayStr) ?? 0;

        const successfulDay = brushCount >= dailyTarget;

        if (successfulDay) {
          if (!currentStart) currentStart = new Date(cursor);
          currentLength += 1;
        } else {
          if (currentLength > 0 && currentStart) {
            const endDate = new Date(cursor);
            endDate.setDate(endDate.getDate() - 1);
            periods.push({
              id: `${periods.length + 1}`,
              startDate: getHabitDayString(currentStart),
              endDate: getHabitDayString(endDate),
              duration: currentLength,
            });
          }
          currentStart = null;
          currentLength = 0;
        }

        // Jump to the *next* habit-day boundary (add 24 h). Using setTime avoids DST pitfalls.
        cursor.setTime(cursor.getTime() + 24 * 60 * 60 * 1000);
      }

      // Close an open period that reaches today
      if (currentLength > 0 && currentStart) {
        periods.push({
          id: `${periods.length + 1}`,
          startDate: getHabitDayString(currentStart),
          endDate: getTodayHabitString(),
          duration: currentLength,
        });
      }

      // 5) Sort by duration desc, tie-break newer first
      periods.sort((a, b) => {
        if (b.duration !== a.duration) return b.duration - a.duration;
        return a.startDate < b.startDate ? 1 : -1;
      });

      const history: StreakHistory = {
        periods,
        lastUpdated: Date.now(),
      };

      await StreakDataService.cacheHistoryData(history);
      return history;
    } catch (error) {
      console.error('Error calculating streak history:', error);
      return { periods: [], lastUpdated: Date.now() };
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