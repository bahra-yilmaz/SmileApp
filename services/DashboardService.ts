import { supabase } from './supabaseClient';
import { subDays, startOfDay, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestUserService } from './GuestUserService';
import { calculateStreak } from '../utils/streakUtils';
import { StreakService } from './StreakService';
import { BrushingGoalsService } from './BrushingGoalsService';
import { ToothbrushService } from './toothbrush';

export interface DashboardStats {
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
 * Determines which service to use based on the user ID.
 * Returns GuestUserService for guests, or a Supabase query builder for authenticated users.
 */
function getServiceForUser(userId: string) {
  if (userId === 'guest') {
    console.log('👻 Using GuestUserService for data fetching.');
    return { service: GuestUserService, isGuest: true };
  }
  return { service: supabase, isGuest: false };
}

const TOOTHBRUSH_DATA_KEY = 'toothbrush_data';

/**
 * Fetches all dashboard statistics for the home screen cards
 */
export async function getDashboardStats(userId: string, brushingGoalMinutes: number = 2): Promise<DashboardStats> {
  console.log('📊 Getting dashboard stats for userId:', userId, 'fallback goal:', brushingGoalMinutes);
  
  // Handle guest users separately
  if (userId === 'guest') {
    console.log('👻 Using GuestUserService for dashboard stats.');
    return await GuestUserService.getGuestDashboardStats(brushingGoalMinutes);
  }
  
  // Authenticated user logic
  try {
    // Use centralized BrushingGoalsService for goals data
    const goals = await BrushingGoalsService.getCurrentGoals();
    console.log('🎯 Using centralized goals:', goals);
    
    // Fetch brushing logs for the past 30 days to calculate stats
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data: brushingLogs, error } = await supabase
      .from('brushing_logs')
      .select('"duration-seconds", date, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brushing logs:', error);
      throw error;
    }

    const logs = brushingLogs || [];

    // Calculate streak days using centralized service
    const streakDays = await StreakService.getCurrentStreak(userId);

    // Get last brushing time
    const lastBrushingTime = getLastBrushingTime(logs);

    // Calculate average brushing time
    const averageBrushingTime = calculateAverageBrushingTime(logs);

    // Calculate average of last 10 brushings
    const averageLast10Brushings = calculateAverageLast10Brushings(logs);

    // Get toothbrush days in use using centralized service
    const toothbrushDaysInUse = await ToothbrushService.getSimpleDaysInUse();

    return {
      streakDays,
      lastBrushingTime,
      toothbrushDaysInUse,
      averageBrushingTime,
      averageLast10Brushings,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
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
 * Fetches recent brushing logs for a user.
 * @param userId - The ID of the user.
 * @returns A promise that resolves to an array of recent brushing logs.
 */
export async function getRecentBrushingLogs(userId: string): Promise<any[]> {
  if (userId === 'guest') {
    // Trend analysis is not for guest users, so return an empty array.
    return [];
  }

  const thirtyDaysAgo = subDays(new Date(), 30);
  const { data: brushingLogs, error } = await supabase
    .from('brushing_logs')
    .select('"duration-seconds", date, created_at')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching recent brushing logs:', error);
    throw error;
  }
  
  return brushingLogs || [];
}

/**
 * Get the most recent brushing session time
 */
function getLastBrushingTime(logs: any[]): { minutes: number; seconds: number } {
  if (!logs.length) return { minutes: 0, seconds: 0 };

  const lastLog = logs[0]; // Logs are ordered by created_at desc
  const durationInSeconds = lastLog['duration-seconds'] || 0;
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  
  return { minutes, seconds };
}

/**
 * Calculate average brushing time from recent sessions
 */
function calculateAverageBrushingTime(logs: any[]): { minutes: number; seconds: number } {
  if (!logs.length) return { minutes: 0, seconds: 0 };

  const totalSeconds = logs.reduce((sum, log) => sum + (log['duration-seconds'] || 0), 0);
  const averageSeconds = Math.round(totalSeconds / logs.length);
  
  const minutes = Math.floor(averageSeconds / 60);
  const seconds = averageSeconds % 60;
  
  return { minutes, seconds };
}

/**
 * Calculate average brushing time from the last 10 sessions
 */
function calculateAverageLast10Brushings(logs: any[]): { minutes: number; seconds: number } {
  if (!logs.length) return { minutes: 0, seconds: 0 };

      // Take only the last 10 sessions (logs are already ordered by created_at desc)
    const last10 = logs.slice(0, 10);
    const totalSeconds = last10.reduce((sum, log) => sum + (log['duration-seconds'] || 0), 0);
  const averageSeconds = Math.round(totalSeconds / last10.length);
  
  const minutes = Math.floor(averageSeconds / 60);
  const seconds = averageSeconds % 60;
  
  return { minutes, seconds };
}

// Removed: getToothbrushDaysInUse - now handled by ToothbrushService

/**
 * Get calendar brushing data for the calendar view
 */
export async function getCalendarBrushingData(userId: string): Promise<Record<string, number>> {
  // Handle guest users with the GuestUserService
  if (userId === 'guest') {
    console.log('👻 Using GuestUserService for calendar data.');
    return await GuestUserService.getGuestCalendarData();
  }

  // Authenticated user logic
  try {
    const today = new Date();
    // Fetch brushing logs for the past 30 days
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data: brushingLogs, error } = await supabase
      .from('brushing_logs')
      .select('date, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calendar data:', error);
      return {};
    }

    const logs = brushingLogs || [];
    
    // Group logs by date and count brushing sessions per day
    const brushingByDate: Record<string, number> = {};
    
    logs.forEach(log => {
      const date = log.date || log.created_at?.slice(0, 10);
      if (!date) return;
      
      brushingByDate[date] = (brushingByDate[date] || 0) + 1;
    });

    return brushingByDate;
  } catch (error) {
    console.error('Error fetching calendar brushing data:', error);
    return {};
  }
}

/**
 * Get streak data for the streak overlay
 * @deprecated Use StreakService.getStreakData() directly instead
 */
export async function getStreakData(userId: string, brushingGoalMinutes: number = 2): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakHistory: Array<{ startDate: string; endDate: string; duration: number }>;
}> {
  // Handle guest users with the GuestUserService
  if (userId === 'guest') {
    console.log('👻 Using GuestUserService for streak data.');
    const stats = await GuestUserService.getGuestDashboardStats(brushingGoalMinutes);
    return {
      currentStreak: stats.streakDays,
      longestStreak: 0, // Guest mode doesn't track longest streak yet
      streakHistory: [], // Guest mode doesn't track history
    };
  }

  // For authenticated users, delegate to the centralized StreakService
  try {
    const data = await StreakService.getStreakData(userId);
    return {
      currentStreak: data.currentStreak,
      longestStreak: data.longestStreak,
      streakHistory: data.streakHistory,
    };
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakHistory: [],
    };
  }
}

/**
 * Update user's target brushing time in the users table
 */
export async function updateUserBrushingGoal(userId: string, targetTimeInSec: number): Promise<void> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ target_time_in_sec: targetTimeInSec })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user brushing goal:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error updating user brushing goal:', error);
    throw error;
  }
} 