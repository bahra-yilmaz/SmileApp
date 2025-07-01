import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { subDays } from 'date-fns';
import { BrushingGoalsService } from '../BrushingGoalsService';
import { getTodayHabitString } from '../../utils/dateUtils';
import { STREAK_CONFIG } from './StreakConfig';
import { 
  StreakData, 
  StreakHistory, 
  StreakSession, 
  DailyGoalStatus,
  StreakCalculationOptions 
} from './StreakTypes';

/**
 * Handles all data access and caching operations for streak functionality
 */
export class StreakDataService {
  private static streakCache: StreakData | null = null;
  private static historyCache: StreakHistory | null = null;

  /**
   * Initialize the data service and load cached data
   */
  static async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.loadStreakCache(),
        this.loadHistoryCache()
      ]);
    } catch (error) {
      console.error('Error initializing StreakDataService:', error);
    }
  }

  /**
   * Get cached streak data if valid, otherwise return null
   */
  static getCachedStreakData(userId: string): StreakData | null {
    if (!this.streakCache || 
        this.streakCache.userId !== userId ||
        Date.now() - this.streakCache.lastCalculated > STREAK_CONFIG.CACHE_DURATION_MS) {
      return null;
    }
    return this.streakCache;
  }

  /**
   * Get cached history data if valid, otherwise return null
   */
  static getCachedHistoryData(): StreakHistory | null {
    if (!this.historyCache || 
        Date.now() - this.historyCache.lastUpdated > STREAK_CONFIG.CACHE_DURATION_MS) {
      return null;
    }
    return this.historyCache;
  }

  /**
   * Fetch brushing sessions for a user within a date range
   */
  static async fetchBrushingSessions(
    userId: string, 
    startDate: Date, 
    endDate?: Date
  ): Promise<StreakSession[]> {
    if (userId === 'guest') {
      return this.fetchGuestBrushingSessions(startDate, endDate);
    }
    
    return this.fetchAuthenticatedUserSessions(userId, startDate, endDate);
  }

  /**
   * Fetch today's brushing sessions for daily goal checking (using habit day with 3:00 AM reset)
   */
  static async fetchTodaysSessions(userId: string): Promise<StreakSession[]> {
    const habitDay = getTodayHabitString();
    const todayStart = new Date(habitDay + 'T00:00:00');
    const todayEnd = new Date(habitDay + 'T23:59:59');
    
    return this.fetchBrushingSessions(userId, todayStart, todayEnd);
  }

  /**
   * Get user's daily brushing frequency goal
   */
  static async getUserDailyTarget(): Promise<number> {
    try {
      const goals = await BrushingGoalsService.getCurrentGoals();
      return goals.dailyFrequency;
    } catch (error) {
      console.error('Error fetching user daily target:', error);
      return STREAK_CONFIG.DEFAULTS.DAILY_BRUSHING_TARGET;
    }
  }

  /**
   * Cache streak data
   */
  static async cacheStreakData(streakData: StreakData): Promise<void> {
    this.streakCache = streakData;
    await this.saveStreakCache(streakData);
  }

  /**
   * Cache history data
   */
  static async cacheHistoryData(historyData: StreakHistory): Promise<void> {
    this.historyCache = historyData;
    await this.saveHistoryCache(historyData);
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STREAK_CONFIG.STORAGE_KEYS.STREAK_CACHE),
        AsyncStorage.removeItem(STREAK_CONFIG.STORAGE_KEYS.STREAK_HISTORY)
      ]);
      
      this.streakCache = null;
      this.historyCache = null;
    } catch (error) {
      console.error('Error clearing streak cache:', error);
    }
  }

  // Private helper methods

  private static async fetchGuestBrushingSessions(
    startDate: Date, 
    endDate?: Date
  ): Promise<StreakSession[]> {
    try {
      const guestLogs = await AsyncStorage.getItem('guest_brushing_logs');
      if (!guestLogs) return [];

      const logs = JSON.parse(guestLogs);
      return logs.filter((log: any) => {
        const logDate = new Date(log.date || log.created_at);
        const isAfterStart = logDate >= startDate;
        const isBeforeEnd = !endDate || logDate <= endDate;
        return isAfterStart && isBeforeEnd;
      }).map((log: any) => ({
        'duration-seconds': log['duration-seconds'] || log.actualTimeInSec || 0,
        date: log.date || log.created_at?.slice(0, 10),
        created_at: log.created_at
      }));
    } catch (error) {
      console.error('Error fetching guest sessions:', error);
      return [];
    }
  }

  private static async fetchAuthenticatedUserSessions(
    userId: string, 
    startDate: Date, 
    endDate?: Date
  ): Promise<StreakSession[]> {
    try {
      let query = supabase
        .from('brushing_logs')
        .select('"duration-seconds", date, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const { data: brushingLogs, error } = await query;

      if (error) {
        console.error('Error fetching user sessions:', error);
        return [];
      }

      return (brushingLogs || []).map(log => ({
        'duration-seconds': log['duration-seconds'],
        date: log.date || log.created_at?.slice(0, 10),
        created_at: log.created_at
      }));
    } catch (error) {
      console.error('Error fetching authenticated user sessions:', error);
      return [];
    }
  }

  private static async loadStreakCache(): Promise<void> {
    try {
      const cachedStr = await AsyncStorage.getItem(STREAK_CONFIG.STORAGE_KEYS.STREAK_CACHE);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as StreakData;
        if (Date.now() - cached.lastCalculated < STREAK_CONFIG.CACHE_DURATION_MS) {
          this.streakCache = cached;
        }
      }
    } catch (error) {
      console.error('Error loading streak cache:', error);
    }
  }

  private static async loadHistoryCache(): Promise<void> {
    try {
      const historyStr = await AsyncStorage.getItem(STREAK_CONFIG.STORAGE_KEYS.STREAK_HISTORY);
      if (historyStr) {
        this.historyCache = JSON.parse(historyStr) as StreakHistory;
      }
    } catch (error) {
      console.error('Error loading history cache:', error);
    }
  }

  private static async saveStreakCache(streakData: StreakData): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STREAK_CONFIG.STORAGE_KEYS.STREAK_CACHE, 
        JSON.stringify(streakData)
      );
    } catch (error) {
      console.error('Error saving streak cache:', error);
    }
  }

  private static async saveHistoryCache(history: StreakHistory): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STREAK_CONFIG.STORAGE_KEYS.STREAK_HISTORY, 
        JSON.stringify(history)
      );
    } catch (error) {
      console.error('Error saving streak history cache:', error);
    }
  }
} 