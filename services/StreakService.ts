import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { calculateStreak, StreakSession } from '../utils/streakUtils';
import { subDays } from 'date-fns';
import { BrushingGoalsService } from './BrushingGoalsService';
import { getTodayLocalString } from '../utils/dateUtils';

// Storage keys
const STORAGE_KEYS = {
  STREAK_CACHE: 'streak_cache_v1',
  STREAK_HISTORY: 'streak_history_v1',
} as const;

// Cache duration (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Streak data interfaces
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCalculated: number; // timestamp
  userId?: string;
  aimedSessionsPerDay: number;
}

export interface StreakPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // days
}

export interface StreakHistory {
  periods: StreakPeriod[];
  lastUpdated: number;
}

// Events for listening to changes
export type StreakEvent = 'streak-updated' | 'streak-calculated' | 'history-updated';

export class StreakService {
  private static listeners: Map<StreakEvent, Function[]> = new Map();
  private static currentStreakCache: StreakData | null = null;
  private static historyCache: StreakHistory | null = null;

  /**
   * Initialize the service
   */
  static async initialize(): Promise<void> {
    try {
      // Load cached streak data
      const cachedStr = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_CACHE);
      if (cachedStr) {
        const cached = JSON.parse(cachedStr) as StreakData;
        // Check if cache is still valid
        if (Date.now() - cached.lastCalculated < CACHE_DURATION_MS) {
          this.currentStreakCache = cached;
        }
      }

      // Load cached history
      const historyStr = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_HISTORY);
      if (historyStr) {
        this.historyCache = JSON.parse(historyStr) as StreakHistory;
      }
    } catch (error) {
      console.error('Error initializing StreakService:', error);
    }
  }

  /**
   * Get current streak for a user
   */
  static async getCurrentStreak(
    userId: string, 
    options: { 
      forceRefresh?: boolean;
      includeToday?: boolean;
    } = {}
  ): Promise<number> {
    const { forceRefresh = false, includeToday = true } = options;

    // Check cache first (unless forced refresh)
    if (!forceRefresh && this.currentStreakCache && 
        this.currentStreakCache.userId === userId &&
        Date.now() - this.currentStreakCache.lastCalculated < CACHE_DURATION_MS) {
      return this.currentStreakCache.currentStreak;
    }

    // Calculate fresh streak
    const streakData = await this.calculateStreakData(userId, includeToday);
    
    // Cache the result
    this.currentStreakCache = streakData;
    await this.saveStreakCache(streakData);
    
    // Emit event
    this.emit('streak-calculated', streakData);

    return streakData.currentStreak;
  }

  /**
   * Get comprehensive streak data (current, longest, history)
   */
  static async getStreakData(
    userId: string,
    options: { forceRefresh?: boolean } = {}
  ): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakHistory: StreakPeriod[];
  }> {
    const { forceRefresh = false } = options;

    // Get current streak
    const currentStreak = await this.getCurrentStreak(userId, { forceRefresh });
    
    // Get or calculate longest streak and history
    let longestStreak: number;
    let streakHistory: StreakPeriod[];

    if (!forceRefresh && this.historyCache && 
        Date.now() - this.historyCache.lastUpdated < CACHE_DURATION_MS) {
      // Use cached history
      streakHistory = this.historyCache.periods;
      longestStreak = Math.max(...streakHistory.map(p => p.duration), currentStreak);
    } else {
      // Calculate fresh history
      const history = await this.calculateStreakHistory(userId);
      streakHistory = history.periods;
      longestStreak = Math.max(...streakHistory.map(p => p.duration), currentStreak);
      
      // Cache history
      this.historyCache = {
        periods: streakHistory,
        lastUpdated: Date.now()
      };
      await this.saveHistoryCache(this.historyCache);
    }

    return {
      currentStreak,
      longestStreak,
      streakHistory
    };
  }

  /**
   * Update streak after a new brushing session
   */
  static async updateStreakAfterBrushing(
    userId: string,
    newSession: StreakSession
  ): Promise<{
    previousStreak: number;
    newStreak: number;
    streakChanged: boolean;
  }> {
    const previousStreak = this.currentStreakCache?.currentStreak ?? 0;
    
    // Force refresh to include the new session
    const newStreak = await this.getCurrentStreak(userId, { forceRefresh: true });
    
    const streakChanged = newStreak !== previousStreak;
    
    if (streakChanged) {
      this.emit('streak-updated', {
        userId,
        previousStreak,
        newStreak,
        newSession
      });
    }

    return {
      previousStreak,
      newStreak,
      streakChanged
    };
  }

  /**
   * Check if user hit their daily goal today
   */
  static async checkDailyGoalStatus(userId: string): Promise<{
    hitGoalToday: boolean;
    sessionsToday: number;
    requiredSessions: number;
    remainingSessions: number;
  }> {
    try {
      // Get user's daily frequency goal
      const goals = await BrushingGoalsService.getCurrentGoals();
      const requiredSessions = goals.dailyFrequency;

      // Get today's sessions (use local timezone to match calendar)
      const today = getTodayLocalString();
      
      let sessionsToday = 0;
      
      if (userId === 'guest') {
        // Handle guest users - check AsyncStorage
        try {
          const guestLogs = await AsyncStorage.getItem('guest_brushing_logs');
          if (guestLogs) {
            const logs = JSON.parse(guestLogs);
            sessionsToday = logs.filter((log: any) => 
              log.date === today || log.created_at?.slice(0, 10) === today
            ).length;
          }
        } catch (error) {
          console.error('Error checking guest daily goal:', error);
        }
      } else {
        // Handle authenticated users
        const { data: todayLogs, error } = await supabase
          .from('brushing_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('date', today);

        if (!error) {
          sessionsToday = todayLogs?.length ?? 0;
        }
      }

      const hitGoalToday = sessionsToday >= requiredSessions;
      const remainingSessions = Math.max(0, requiredSessions - sessionsToday);

      return {
        hitGoalToday,
        sessionsToday,
        requiredSessions,
        remainingSessions
      };
    } catch (error) {
      console.error('Error checking daily goal status:', error);
      return {
        hitGoalToday: false,
        sessionsToday: 0,
        requiredSessions: 2,
        remainingSessions: 2
      };
    }
  }

  /**
   * Calculate streak data from database/storage
   */
  private static async calculateStreakData(userId: string, includeToday: boolean = true): Promise<StreakData> {
    try {
      // Get user's daily frequency goal
      const goals = await BrushingGoalsService.getCurrentGoals();
      const aimedSessionsPerDay = goals.dailyFrequency;

      let sessions: StreakSession[] = [];

      if (userId === 'guest') {
        // Handle guest users
        try {
          const guestLogs = await AsyncStorage.getItem('guest_brushing_logs');
          if (guestLogs) {
            const logs = JSON.parse(guestLogs);
            sessions = logs.map((log: any) => ({
              'duration-seconds': log['duration-seconds'] || log.actualTimeInSec || 0,
              date: log.date || log.created_at?.slice(0, 10),
              created_at: log.created_at
            }));
          }
        } catch (error) {
          console.error('Error fetching guest sessions for streak:', error);
        }
      } else {
        // Handle authenticated users
        const thirtyDaysAgo = subDays(new Date(), 30);
        const { data: brushingLogs, error } = await supabase
          .from('brushing_logs')
          .select('"duration-seconds", date, created_at')
          .eq('user_id', userId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (!error && brushingLogs) {
          sessions = brushingLogs.map(log => ({
            'duration-seconds': log['duration-seconds'],
            date: log.date || log.created_at?.slice(0, 10),
            created_at: log.created_at
          }));
        }
      }

      // Calculate current streak
      const currentStreak = calculateStreak(sessions, aimedSessionsPerDay);
      
      // For longest streak, we'd need to analyze historical data
      // For now, use current streak as minimum longest
      const longestStreak = Math.max(currentStreak, this.currentStreakCache?.longestStreak ?? 0);

      return {
        currentStreak,
        longestStreak,
        lastCalculated: Date.now(),
        userId,
        aimedSessionsPerDay
      };
    } catch (error) {
      console.error('Error calculating streak data:', error);
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastCalculated: Date.now(),
        userId,
        aimedSessionsPerDay: 2
      };
    }
  }

  /**
   * Calculate streak history (periods of consecutive days)
   */
  private static async calculateStreakHistory(userId: string): Promise<StreakHistory> {
    try {
      // For now, return mock data
      // In a real implementation, you'd analyze all historical data
      // to find all streak periods
      const periods: StreakPeriod[] = [
        {
          id: 'current',
          startDate: getTodayLocalString(), // Simplified for now - would need proper calculation
          endDate: getTodayLocalString(),
          duration: await this.getCurrentStreak(userId, { forceRefresh: false })
        }
      ];

      return {
        periods: periods.filter(p => p.duration > 0),
        lastUpdated: Date.now()
      };
    } catch (error) {
      console.error('Error calculating streak history:', error);
      return {
        periods: [],
        lastUpdated: Date.now()
      };
    }
  }

  /**
   * Clear all caches (useful for testing or data reset)
   */
  static async clearCache(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.STREAK_CACHE),
        AsyncStorage.removeItem(STORAGE_KEYS.STREAK_HISTORY)
      ]);
      
      this.currentStreakCache = null;
      this.historyCache = null;
      
      this.emit('streak-updated', { cleared: true });
    } catch (error) {
      console.error('Error clearing streak cache:', error);
    }
  }

  /**
   * Event subscription
   */
  static on(event: StreakEvent, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event to listeners
   */
  private static emit(event: StreakEvent, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in streak event callback:', error);
        }
      });
    }
  }

  /**
   * Save streak cache to AsyncStorage
   */
  private static async saveStreakCache(streakData: StreakData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_CACHE, JSON.stringify(streakData));
    } catch (error) {
      console.error('Error saving streak cache:', error);
    }
  }

  /**
   * Save history cache to AsyncStorage
   */
  private static async saveHistoryCache(history: StreakHistory): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_HISTORY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving streak history cache:', error);
    }
  }

  /**
   * Debug current state (for development)
   */
  static async debugCurrentState(): Promise<void> {
    console.log('=== StreakService Debug ===');
    console.log('Current Cache:', this.currentStreakCache);
    console.log('History Cache:', this.historyCache);
    
    try {
      const storedCache = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_CACHE);
      const storedHistory = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_HISTORY);
      console.log('Stored Cache:', storedCache ? JSON.parse(storedCache) : null);
      console.log('Stored History:', storedHistory ? JSON.parse(storedHistory) : null);
    } catch (error) {
      console.error('Error reading stored data:', error);
    }
    console.log('=== End Debug ===');
  }
} 