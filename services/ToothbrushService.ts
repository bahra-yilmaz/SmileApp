import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { getLocalDateString, getTodayLocalString } from '../utils/dateUtils';
import { Toothbrush, ToothbrushData } from '../components/ToothbrushManager';

// Storage keys
const STORAGE_KEYS = {
  TOOTHBRUSH_DATA: 'toothbrush_data',
  TOOTHBRUSH_USAGE_CACHE: 'toothbrush_usage_cache_v1',
} as const;

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export interface ToothbrushUsageStats {
  totalCalendarDays: number;        // Total days since start date
  actualBrushingDays: number;       // Days user actually brushed with this toothbrush
  totalBrushingSessions: number;    // Total number of brushing sessions
  averageBrushingsPerDay: number;   // Average brushings per day (when used)
  usagePercentage: number;          // Percentage of days actually used
  lastUsedDate?: string;            // Last date this toothbrush was used (YYYY-MM-DD)
  replacementStatus: 'brand_new' | 'fresh' | 'good' | 'replace_soon' | 'overdue';
  replacementColor: string;
  replacementText: string;
}

export interface ToothbrushUsageCache {
  toothbrushId: string;
  stats: ToothbrushUsageStats;
  lastCalculated: number;
  userId: string;
}

/**
 * Service for tracking toothbrush usage statistics
 * Counts actual brushing days vs just calendar days for more meaningful metrics
 */
export class ToothbrushService {
  private static usageCache: ToothbrushUsageCache | null = null;

  /**
   * Get comprehensive usage statistics for current toothbrush
   */
  static async getCurrentToothbrushStats(userId: string): Promise<ToothbrushUsageStats | null> {
    try {
      // Get current toothbrush
      const toothbrushData = await this.getToothbrushData();
      if (!toothbrushData.current) {
        console.log('🦷 No current toothbrush found, attempting to initialize...');
        
        // Try to initialize from database if we have an authenticated user
        if (userId && userId !== 'guest') {
          await this.initializeFromDatabase(userId);
          
          // Try again after initialization
          const retryData = await this.getToothbrushData();
          if (!retryData.current) {
            console.log('🦷 Still no toothbrush data after initialization attempt');
            return null;
          }
        } else {
          return null;
        }
      }

      // Get the current toothbrush after potential initialization
      const currentToothbrushData = await this.getToothbrushData();
      if (!currentToothbrushData.current) {
        return null;
      }

      // Check cache first
      const cachedStats = await this.getCachedStats(currentToothbrushData.current.id, userId);
      if (cachedStats) {
        return cachedStats;
      }

      // Calculate fresh stats
      const stats = await this.calculateToothbrushStats(currentToothbrushData.current, userId);
      
      // Cache the results
      await this.saveCachedStats(currentToothbrushData.current.id, stats, userId);
      
      return stats;
    } catch (error) {
      console.error('Error getting toothbrush stats:', error);
      return null;
    }
  }

  /**
   * Calculate detailed usage statistics for a toothbrush
   */
  private static async calculateToothbrushStats(
    toothbrush: Toothbrush, 
    userId: string
  ): Promise<ToothbrushUsageStats> {
    try {
      const startDate = new Date(toothbrush.startDate);
      const today = new Date();
      
      // Calculate total calendar days
      const totalCalendarDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get brushing logs for this toothbrush period
      const brushingLogs = await this.getBrushingLogsForPeriod(
        getLocalDateString(startDate),
        getTodayLocalString(),
        userId
      );

      // Calculate actual brushing days (unique dates)
      const brushingDays = new Set(brushingLogs.map(log => log.date || log.created_at?.slice(0, 10))).size;
      
      // Calculate total brushing sessions
      const totalSessions = brushingLogs.length;
      
      // Calculate average brushings per day (only for days when used)
      const averageBrushingsPerDay = brushingDays > 0 ? totalSessions / brushingDays : 0;
      
      // Calculate usage percentage
      const usagePercentage = totalCalendarDays > 0 ? (brushingDays / totalCalendarDays) * 100 : 0;
      
      // Get last used date
      const lastUsedDate = brushingLogs.length > 0 
        ? brushingLogs[brushingLogs.length - 1].date || brushingLogs[brushingLogs.length - 1].created_at?.slice(0, 10)
        : undefined;

      // Calculate replacement status
      const { status, color, text } = this.getReplacementStatus(totalCalendarDays);

      return {
        totalCalendarDays,
        actualBrushingDays: brushingDays,
        totalBrushingSessions: totalSessions,
        averageBrushingsPerDay: Math.round(averageBrushingsPerDay * 10) / 10, // Round to 1 decimal
        usagePercentage: Math.round(usagePercentage),
        lastUsedDate,
        replacementStatus: status,
        replacementColor: color,
        replacementText: text,
      };
    } catch (error) {
      console.error('Error calculating toothbrush stats:', error);
      // Return default stats on error
      return {
        totalCalendarDays: 0,
        actualBrushingDays: 0,
        totalBrushingSessions: 0,
        averageBrushingsPerDay: 0,
        usagePercentage: 0,
        replacementStatus: 'brand_new',
        replacementColor: '#1ABC9C',
        replacementText: 'Brand New',
      };
    }
  }

  /**
   * Get brushing logs for a specific period
   */
  private static async getBrushingLogsForPeriod(
    startDate: string, 
    endDate: string, 
    userId: string
  ): Promise<Array<{ date?: string; created_at?: string; 'duration-seconds': number }>> {
    try {
      if (userId === 'guest') {
        // Handle guest users - check their specific guest user ID in database
        const { GuestUserService } = await import('./GuestUserService');
        const guestUserId = await GuestUserService.getCurrentGuestUserId();
        
        if (!guestUserId) return [];

        const { data: logs, error } = await supabase
          .from('brushing_logs')
          .select('"duration-seconds", date, created_at')
          .eq('user_id', guestUserId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching guest brushing logs:', error);
          return [];
        }

        return logs || [];
      } else {
        // Handle authenticated users
        const { data: logs, error } = await supabase
          .from('brushing_logs')
          .select('"duration-seconds", date, created_at')
          .eq('user_id', userId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching brushing logs:', error);
          return [];
        }

        return logs || [];
      }
    } catch (error) {
      console.error('Error in getBrushingLogsForPeriod:', error);
      return [];
    }
  }

  /**
   * Get replacement status based on calendar days
   */
  private static getReplacementStatus(totalDays: number): {
    status: ToothbrushUsageStats['replacementStatus'];
    color: string;
    text: string;
  } {
    if (totalDays < 7) {
      return { status: 'brand_new', text: 'Brand New', color: '#1ABC9C' };
    }
    if (totalDays < 30) {
      return { status: 'fresh', text: 'Fresh', color: '#2ECC71' };
    }
    if (totalDays < 60) {
      return { status: 'good', text: 'Good', color: '#27AE60' };
    }
    if (totalDays < 90) {
      return { status: 'replace_soon', text: 'Replace Soon', color: '#F39C12' };
    }
    return { status: 'overdue', text: 'Overdue', color: '#E74C3C' };
  }

  /**
   * Get toothbrush data from local storage
   */
  static async getToothbrushData(): Promise<ToothbrushData> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.TOOTHBRUSH_DATA);
      if (stored) {
        return JSON.parse(stored);
      }
      return { current: null, history: [] };
    } catch (error) {
      console.error('Error loading toothbrush data:', error);
      return { current: null, history: [] };
    }
  }

  /**
   * Update toothbrush data and sync with database if user has onboarding data
   */
  static async updateToothbrushData(data: ToothbrushData, userId?: string): Promise<void> {
    try {
      // Save to local storage
      await AsyncStorage.setItem(STORAGE_KEYS.TOOTHBRUSH_DATA, JSON.stringify(data));

      // Sync with database if authenticated user and has current toothbrush
      if (userId && userId !== 'guest' && data.current) {
        await this.syncToothbrushWithDatabase(data.current, userId);
      }

      // Clear cache since data changed
      this.usageCache = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.TOOTHBRUSH_USAGE_CACHE);
    } catch (error) {
      console.error('Error updating toothbrush data:', error);
    }
  }

  /**
   * Sync current toothbrush with database (users.toothbrush_start_date)
   */
  private static async syncToothbrushWithDatabase(toothbrush: Toothbrush, userId: string): Promise<void> {
    try {
      const startDateFormatted = getLocalDateString(new Date(toothbrush.startDate));
      
      const { error } = await supabase
        .from('users')
        .update({ 
          toothbrush_start_date: startDateFormatted 
        })
        .eq('id', userId);

      if (error) {
        console.error('Error syncing toothbrush with database:', error);
      } else {
        console.log('✅ Toothbrush synced with database:', startDateFormatted);
      }
    } catch (error) {
      console.error('Error in syncToothbrushWithDatabase:', error);
    }
  }

  /**
   * Initialize toothbrush from database data (for onboarding)
   */
  static async initializeFromDatabase(userId: string): Promise<void> {
    try {
      if (userId === 'guest') {
        return;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('toothbrush_start_date')
        .eq('id', userId)
        .maybeSingle();

      if (error || !userData?.toothbrush_start_date) {
        return;
      }

      const currentData = await this.getToothbrushData();
      const dbStartDate = userData.toothbrush_start_date;
      const currentStartDate = currentData.current?.startDate?.slice(0, 10); // Get YYYY-MM-DD part
      
      // Initialize if no toothbrush exists OR if dates don't match (onboarding updated the date)
      if (!currentData.current || currentStartDate !== dbStartDate) {
        console.log('🦷 Updating toothbrush with database date:', dbStartDate);
        
        const startDate = new Date(dbStartDate + 'T00:00:00.000Z');
        const now = new Date();
        const daysSinceStart = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const newToothbrush: Toothbrush = {
          id: currentData.current?.id || Date.now().toString(),
          type: currentData.current?.type || 'manual',
          category: currentData.current?.category || 'regular',  
          startDate: startDate.toISOString(),
          name: currentData.current?.name || 'First Brush',
        };

        const newData: ToothbrushData = {
          current: newToothbrush,
          history: currentData.history,
        };

        await AsyncStorage.setItem(STORAGE_KEYS.TOOTHBRUSH_DATA, JSON.stringify(newData));
        
        // Create estimated historical brushing data if this is from onboarding (more than 7 days old)
        if (daysSinceStart > 7) {
          await this.createEstimatedBrushingHistory(userId, startDate, daysSinceStart);
        }
        
        // Clear cache to force recalculation
        this.usageCache = null;
        await AsyncStorage.removeItem(STORAGE_KEYS.TOOTHBRUSH_USAGE_CACHE);
      }
    } catch (error) {
      console.error('❌ Error initializing toothbrush from database:', error);
    }
  }

  /**
   * Create estimated historical brushing data for onboarding users
   */
  private static async createEstimatedBrushingHistory(
    userId: string, 
    startDate: Date, 
    totalDays: number
  ): Promise<void> {
    try {
      // First check if user already has brushing logs to avoid duplicating data
      const { data: existingLogs, error: checkError } = await supabase
        .from('brushing_logs')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
        
      if (checkError) {
        console.error('❌ Error checking existing logs:', checkError);
        return;
      }
      
      if (existingLogs && existingLogs.length > 0) {
        return;
      }
      
      // Get user's current brushing goals
      const { BrushingGoalsService } = await import('./BrushingGoalsService');
      const goals = await BrushingGoalsService.getCurrentGoals();
      const targetSessionsPerDay = goals.dailyFrequency; // Usually 2
      const avgDurationSec = Math.round(goals.timeTargetMinutes * 60); // Target time
      
      // Create realistic patterns:
      // - Start with lower adherence (60-70%) and improve to higher (75-85%) 
      // - Sometimes 1 session, sometimes 2+ sessions per day
      // - Slightly varied durations around target
      // - More consistent in recent weeks (as users develop habits)
      
      const estimatedLogs = [];
      const usedDates = new Set<string>();
      
      // Create adherence pattern that improves over time
      for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + dayOffset);
        
        // Don't add future dates or today (they can brush today manually)
        if (currentDate >= new Date() || currentDate.toDateString() === new Date().toDateString()) {
          continue;
        }
        
        // Adherence improves over time (60% early, 85% recent)
        const progressRatio = dayOffset / totalDays;
        const baseAdherence = 0.6 + (progressRatio * 0.25); // 60% -> 85%
        
        // Add some randomness but keep it realistic
        const dailyAdherence = baseAdherence + (Math.random() - 0.5) * 0.2; // ±10%
        
        // Should they brush today?
        if (Math.random() < Math.max(0.4, Math.min(0.9, dailyAdherence))) {
          const dateStr = currentDate.toISOString().slice(0, 10);
          usedDates.add(dateStr);
          
          // How many sessions today?
          // Recent weeks: more likely to hit target
          // Early weeks: more likely to miss sessions
          let sessionsForDay;
          if (progressRatio > 0.7) { // Recent 30% of time
            // 70% target, 20% single, 10% extra
            const rand = Math.random();
            if (rand < 0.7) sessionsForDay = targetSessionsPerDay;
            else if (rand < 0.9) sessionsForDay = 1;
            else sessionsForDay = targetSessionsPerDay + 1;
          } else { // Earlier period
            // 50% target, 40% single, 10% extra
            const rand = Math.random();
            if (rand < 0.5) sessionsForDay = targetSessionsPerDay;
            else if (rand < 0.9) sessionsForDay = 1;
            else sessionsForDay = targetSessionsPerDay + 1;
          }
          
          // Create sessions for this day
          for (let session = 0; session < sessionsForDay; session++) {
            // Duration improves over time too (starts shorter, gets closer to target)
            const durationProgress = 0.7 + (progressRatio * 0.3); // 70% -> 100% of target
            const baseDuration = avgDurationSec * durationProgress;
            const durationVariation = (Math.random() - 0.5) * 40; // -20 to +20 seconds
            const duration = Math.max(30, Math.round(baseDuration + durationVariation));
            
            // Spread sessions throughout the day (morning, evening, etc.)
            const sessionTime = new Date(dateStr + 'T00:00:00.000Z');
            if (session === 0) {
              // Morning session (7-9 AM)
              sessionTime.setHours(7 + Math.random() * 2);
            } else if (session === 1) {
              // Evening session (7-10 PM)  
              sessionTime.setHours(19 + Math.random() * 3);
            } else {
              // Additional sessions (random times)
              sessionTime.setHours(10 + Math.random() * 9); // Daytime hours
            }
            sessionTime.setMinutes(Math.random() * 60);
            
            estimatedLogs.push({
              user_id: userId,
              'duration-seconds': duration,
              date: dateStr,
              created_at: sessionTime.toISOString(),
              earned_points: Math.round(duration / 30 * 10), // Rough points estimate
            });
          }
        }
      }
      
      // Insert in batches to avoid overwhelming the database
      const batchSize = 50;
      let totalInserted = 0;
      for (let i = 0; i < estimatedLogs.length; i += batchSize) {
        const batch = estimatedLogs.slice(i, i + batchSize);
        const { error } = await supabase
          .from('brushing_logs')
          .insert(batch);
          
        if (error) {
          console.error('❌ Error inserting estimated brushing history batch:', error);
          // Continue with other batches even if one fails
        } else {
          totalInserted += batch.length;
        }
      }
      
      console.log(`✅ Created ${totalInserted} estimated brushing sessions for ${totalDays} days`);
    } catch (error) {
      console.error('❌ Error creating estimated brushing history:', error);
      // Don't throw - this is enhancement, not critical functionality
    }
  }

  /**
   * Get cached stats if valid
   */
  private static async getCachedStats(
    toothbrushId: string, 
    userId: string
  ): Promise<ToothbrushUsageStats | null> {
    try {
      // Check memory cache first
      if (this.usageCache && 
          this.usageCache.toothbrushId === toothbrushId && 
          this.usageCache.userId === userId &&
          Date.now() - this.usageCache.lastCalculated < CACHE_DURATION) {
        return this.usageCache.stats;
      }

      // Check storage cache
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TOOTHBRUSH_USAGE_CACHE);
      if (cached) {
        const cacheData: ToothbrushUsageCache = JSON.parse(cached);
        if (cacheData.toothbrushId === toothbrushId && 
            cacheData.userId === userId &&
            Date.now() - cacheData.lastCalculated < CACHE_DURATION) {
          this.usageCache = cacheData;
          return cacheData.stats;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting cached stats:', error);
      return null;
    }
  }

  /**
   * Save stats to cache
   */
  private static async saveCachedStats(
    toothbrushId: string, 
    stats: ToothbrushUsageStats, 
    userId: string
  ): Promise<void> {
    try {
      const cacheData: ToothbrushUsageCache = {
        toothbrushId,
        stats,
        lastCalculated: Date.now(),
        userId,
      };

      // Save to memory and storage
      this.usageCache = cacheData;
      await AsyncStorage.setItem(STORAGE_KEYS.TOOTHBRUSH_USAGE_CACHE, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error saving cached stats:', error);
    }
  }

  /**
   * Clear all toothbrush caches
   */
  static async clearCache(): Promise<void> {
    try {
      this.usageCache = null;
      await AsyncStorage.removeItem(STORAGE_KEYS.TOOTHBRUSH_USAGE_CACHE);
    } catch (error) {
      console.error('Error clearing toothbrush cache:', error);
    }
  }

  /**
   * Force refresh stats (bypasses cache)
   */
  static async refreshStats(userId: string): Promise<ToothbrushUsageStats | null> {
    try {
      await this.clearCache();
      return await this.getCurrentToothbrushStats(userId);
    } catch (error) {
      console.error('Error refreshing stats:', error);
      return null;
    }
  }

  /**
   * Get simple days in use (for backward compatibility)
   */
  static async getSimpleDaysInUse(): Promise<number> {
    try {
      const data = await this.getToothbrushData();
      if (!data.current) return 0;

      const startDate = new Date(data.current.startDate);
      const now = new Date();
      return Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error getting simple days in use:', error);
      return 0;
    }
  }

  /**
   * Force complete refresh and recalculation (used after onboarding)
   */
  static async forceCompleteRefresh(userId: string): Promise<ToothbrushUsageStats | null> {
    try {
      console.log('🦷 Forcing complete toothbrush data refresh for user:', userId);
      
      // Clear all caches
      await this.clearCache();
      
      // Initialize from database if needed
      if (userId && userId !== 'guest') {
        await this.initializeFromDatabase(userId);
      }
      
      // Get fresh stats
      return await this.getCurrentToothbrushStats(userId);
    } catch (error) {
      console.error('Error in forceCompleteRefresh:', error);
      return null;
    }
  }
} 