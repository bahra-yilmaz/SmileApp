import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';
import { calculateEarnedPoints } from '../utils/calculateEarnedPoints';
import { StreakSession } from '../utils/streakUtils';
import { StreakService } from './StreakService';
import { BrushingGoalsService } from './BrushingGoalsService';

// Generate a proper UUID v4 format for React Native (compatible with PostgreSQL UUID type)
function generateGuestUserId(): string {
  // Generate random hex values
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  
  // Create UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  // The 4 indicates version 4, and y is one of 8, 9, A, or B
  return `${s4()}${s4()}-${s4()}-4${s4().substr(0,3)}-${['8','9','a','b'][Math.floor(Math.random()*4)]}${s4().substr(0,3)}-${s4()}${s4()}${s4()}`;
}

const GUEST_USER_ID_KEY = 'guest_user_id';

// In-memory cache to prevent race conditions
let cachedGuestUserId: string | null = null;
let creationPromise: Promise<string> | null = null;

export interface GuestDashboardStats {
  streakDays: number;
  lastBrushingTime: {
    minutes: number;
    seconds: number;
  };
  toothbrushDaysInUse: number;
  averageBrushingTime: {
    minutes: number;
    seconds: number;
  };
  averageLast10Brushings: {
    minutes: number;
    seconds: number;
  };
}

/**
 * Guest User Service - Creates anonymous guest users in Supabase database
 * This allows data persistence and easier migration to authenticated accounts
 */
export class GuestUserService {
  /**
   * Get or create a guest user ID
   */
  private static async getOrCreateGuestUserId(): Promise<string> {
    // Return cached ID if available
    if (cachedGuestUserId) {
      console.log('👻 Using cached guest user:', cachedGuestUserId);
      return cachedGuestUserId;
    }
    
    // If creation is already in progress, wait for it
    if (creationPromise) {
      return await creationPromise;
    }
    
    // Start creation process
    creationPromise = this.createGuestUser();
    
    try {
      const userId = await creationPromise;
      cachedGuestUserId = userId;
      return userId;
    } finally {
      creationPromise = null;
    }
  }
  
  private static async createGuestUser(): Promise<string> {
    try {
      // Check if we have a stored guest user ID
      const storedGuestUserId = await AsyncStorage.getItem(GUEST_USER_ID_KEY);
      
      if (storedGuestUserId) {
        // Verify this guest user still exists in the database
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', storedGuestUserId)
          .eq('is_guest', true)
          .maybeSingle();
          
        if (existingUser) {
          console.log('👻 Using existing guest user:', storedGuestUserId);
          return storedGuestUserId;
        }
      }
      
      // Create a new guest user in the database
      const guestUserId = generateGuestUserId();
      
      const { error } = await supabase
        .from('users')
        .insert({
          id: guestUserId,
          is_guest: true,
          target_time_in_sec: 120, // 2 minutes default
          created_at: new Date().toISOString(),
        });
        
      if (error) {
        console.error('❌ Error creating guest user:', error);
        throw error;
      }
      
      // Store the guest user ID locally
      await AsyncStorage.setItem(GUEST_USER_ID_KEY, guestUserId);
      
      console.log('👻 Created new guest user:', guestUserId);
      return guestUserId;
    } catch (error) {
      console.error('❌ Error creating guest user:', error);
      throw error;
    }
  }

  /**
   * Insert a new brushing log for guest user
   */
  static async insertGuestBrushingLog(params: {
    actualTimeInSec: number;
    targetTimeInSec: number;
  }): Promise<{ id: string; basePoints: number; bonusPoints: number; total: number; timeStreak: number; dailyStreak: number }> {
    const { actualTimeInSec, targetTimeInSec } = params;
    
    // Use centralized goals service for consistency
    const goals = await BrushingGoalsService.getCurrentGoals();
    const aimedSessionsPerDay = goals.dailyFrequency;
    
    console.log('👻 Inserting guest brushing log:', { actualTimeInSec, targetTimeInSec, aimedSessionsPerDay });
    
    try {
      const guestUserId = await this.getOrCreateGuestUserId();
      
      // Get recent sessions for points calculation
      const { data: recentSessions } = await supabase
        .from('brushing_logs')
        .select('"duration-seconds", date, created_at')
        .eq('user_id', guestUserId)
        .gte('created_at', new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()) // Last 10 days
        .order('created_at', { ascending: false });

      // Convert to the format expected by calculateEarnedPoints
      // Use current target time for all sessions since we don't store it in logs
      const formattedSessions: StreakSession[] = (recentSessions || []).map(session => ({
        'duration-seconds': session['duration-seconds'],
        date: session.date,
        created_at: session.created_at,
      }));

      const todayDateStr = new Date().toISOString().slice(0, 10);
      const currentSession: StreakSession = {
        'duration-seconds': actualTimeInSec,
        date: todayDateStr,
        created_at: new Date().toISOString(),
      };

      // Calculate earned points
      const points = calculateEarnedPoints(
        targetTimeInSec,
        currentSession,
        formattedSessions,
        aimedSessionsPerDay
      );

      // Insert the brushing log
      const { data: insertedLog, error } = await supabase
        .from('brushing_logs')
        .insert({
          user_id: guestUserId,
          'duration-seconds': actualTimeInSec,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          earned_points: points.total,
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error inserting guest brushing log:', error);
        throw error;
      }

      console.log('✅ Guest brushing log inserted:', insertedLog.id);

      return {
        id: insertedLog.id,
        ...points,
      };
    } catch (error) {
      console.error('❌ Error in insertGuestBrushingLog:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics for guest user
   */
  static async getGuestDashboardStats(brushingGoalMinutes: number): Promise<GuestDashboardStats> {
    console.log('👻 Fetching guest dashboard stats...');
    
    try {
      const guestUserId = await this.getOrCreateGuestUserId();
      const targetTimeInSec = Math.round(brushingGoalMinutes * 60);
      
      // Get all brushing logs for calculations
      const { data: logs } = await supabase
        .from('brushing_logs')
        .select('"duration-seconds", date, created_at')
        .eq('user_id', guestUserId)
        .order('created_at', { ascending: true });

      if (!logs || logs.length === 0) {
        console.log('👻 No logs found for guest user');
        return {
          streakDays: 0,
          lastBrushingTime: { minutes: 0, seconds: 0 },
          toothbrushDaysInUse: 0,
          averageBrushingTime: { minutes: 0, seconds: 0 },
          averageLast10Brushings: { minutes: 0, seconds: 0 },
        };
      }

      // Use centralized StreakService for consistency
      const streakDays = await StreakService.getCurrentStreak(guestUserId);

      // Get last brushing time
      const lastLog = logs[logs.length - 1];
      const lastBrushingTime = {
        minutes: Math.floor(lastLog['duration-seconds'] / 60),
        seconds: lastLog['duration-seconds'] % 60,
      };

      // Calculate toothbrush days in use
      const firstLogDate = new Date(logs[0].created_at);
      const toothbrushDaysInUse = Math.ceil((Date.now() - firstLogDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate average brushing time
      const totalSeconds = logs.reduce((sum, log) => sum + log['duration-seconds'], 0);
      const avgSeconds = Math.round(totalSeconds / logs.length);
      const averageBrushingTime = {
        minutes: Math.floor(avgSeconds / 60),
        seconds: avgSeconds % 60,
      };

      // Calculate average of last 10 brushings
      const last10 = logs.slice(-10);
      const last10TotalSeconds = last10.reduce((sum, log) => sum + log['duration-seconds'], 0);
      const last10AvgSeconds = Math.round(last10TotalSeconds / last10.length);
      const averageLast10Brushings = {
        minutes: Math.floor(last10AvgSeconds / 60),
        seconds: last10AvgSeconds % 60,
      };

      const stats = {
        streakDays,
        lastBrushingTime,
        toothbrushDaysInUse,
        averageBrushingTime,
        averageLast10Brushings,
      };

      console.log('📊 Guest stats calculated:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting guest dashboard stats:', error);
      // Return empty stats on error
      return {
        streakDays: 0,
        lastBrushingTime: { minutes: 0, seconds: 0 },
        toothbrushDaysInUse: 0,
        averageBrushingTime: { minutes: 0, seconds: 0 },
        averageLast10Brushings: { minutes: 0, seconds: 0 },
      };
    }
  }

  /**
   * Get calendar data for guest user
   */
  static async getGuestCalendarData(): Promise<Record<string, number>> {
    console.log('👻 Fetching guest calendar data...');
    
    try {
      const guestUserId = await this.getOrCreateGuestUserId();
      
      const { data: logs } = await supabase
        .from('brushing_logs')
        .select('date, "duration-seconds"')
        .eq('user_id', guestUserId)
        .order('date', { ascending: true });

      if (!logs) {
        return {};
      }

      // Group by date and count sessions (not sum duration) for each day
      const calendarData: Record<string, number> = {};
      logs.forEach(log => {
        if (calendarData[log.date]) {
          calendarData[log.date] += 1; // Count sessions, not duration
        } else {
          calendarData[log.date] = 1; // First session for this date
        }
      });

      console.log('📅 Guest calendar data:', calendarData);
      return calendarData;
    } catch (error) {
      console.error('❌ Error getting guest calendar data:', error);
      return {};
    }
  }

  /**
   * Clear all guest data (for testing or user logout)
   */
  static async clearGuestData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(GUEST_USER_ID_KEY);
      cachedGuestUserId = null; // Clear cache
      creationPromise = null; // Clear any pending creation
      console.log('👻 Guest data cleared');
    } catch (error) {
      console.error('❌ Error clearing guest data:', error);
    }
  }

  /**
   * Get current guest user ID (if exists)
   */
  static async getCurrentGuestUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(GUEST_USER_ID_KEY);
    } catch (error) {
      console.error('❌ Error getting guest user ID:', error);
      return null;
    }
  }

  /**
   * Convert guest user to authenticated user
   */
  static async convertGuestToAuthenticatedUser(authenticatedUserId: string): Promise<void> {
    try {
      const guestUserId = await this.getCurrentGuestUserId();
      if (!guestUserId) {
        console.log('👻 No guest user to convert');
        return;
      }

      // Update all brushing logs to the authenticated user
      const { error: logsError } = await supabase
        .from('brushing_logs')
        .update({ user_id: authenticatedUserId })
        .eq('user_id', guestUserId);

      if (logsError) {
        console.error('❌ Error converting guest brushing logs:', logsError);
        throw logsError;
      }

      // Delete the guest user record
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', guestUserId);

      if (userError) {
        console.error('❌ Error deleting guest user:', userError);
        throw userError;
      }

      // Clear local guest user ID
      await this.clearGuestData();

      console.log('✅ Guest user converted to authenticated user:', authenticatedUserId);
    } catch (error) {
      console.error('❌ Error converting guest user:', error);
      throw error;
    }
  }

  static async deleteGuestBrushingLog(logId: string): Promise<void> {
    try {
      const guestUserId = await this.getCurrentGuestUserId();
      if (!guestUserId) {
        throw new Error('Guest user ID not found');
      }
      const { error } = await supabase
        .from('brushing_logs')
        .delete()
        .eq('id', logId)
        .eq('user_id', guestUserId);
      if (error) {
        console.error('❌ Error deleting guest brushing log:', error);
        throw error;
      }
      console.log('🗑️ Guest brushing log deleted:', logId);
    } catch (error) {
      console.error('❌ Error in deleteGuestBrushingLog:', error);
      throw error;
    }
  }
} 