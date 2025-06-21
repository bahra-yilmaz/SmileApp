import { supabase } from './supabaseClient';
import { subDays, startOfDay, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GuestUserService } from './GuestUserService';

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
    // First, fetch the user's target time from the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('target_time_in_sec')
      .eq('id', userId)
      .maybeSingle();

    console.log('🎯 User target query result:', { userData, userError });
    console.log('🔍 Detailed user query debug:', {
      queryUserId: userId,
      userIdType: typeof userId,
      userIdLength: userId?.length,
      hasUserData: !!userData,
      userDataKeys: userData ? Object.keys(userData) : 'no data'
    });

    let userTargetSeconds = brushingGoalMinutes * 60; // Default fallback

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
    } else if (userData?.target_time_in_sec) {
      userTargetSeconds = userData.target_time_in_sec;
      console.log('✅ Using user target:', userTargetSeconds, 'seconds');
    } else if (userData) {
      // User exists but target_time_in_sec is null, update it to default
      console.log('🔄 User exists but target_time_in_sec is null, updating to default...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ target_time_in_sec: 120 })
        .eq('id', userId);

      console.log('🔄 Update result:', { updateError });

      if (!updateError) {
        userTargetSeconds = 120;
        console.log('✅ Set and using default target: 120 seconds');
      }
    } else {
      // User doesn't exist - this shouldn't happen for authenticated users
      // For authenticated users, the user record should exist from signup/onboarding
      console.warn('⚠️ Authenticated user not found in database. Using fallback target time.');
      userTargetSeconds = brushingGoalMinutes * 60; // Use the provided goal as fallback
    }
    
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

    // Calculate streak days using the user's actual target
    const streakDays = calculateStreakDays(logs, userTargetSeconds);

    // Get last brushing time
    const lastBrushingTime = getLastBrushingTime(logs);

    // Calculate average brushing time
    const averageBrushingTime = calculateAverageBrushingTime(logs);

    // Calculate average of last 10 brushings
    const averageLast10Brushings = calculateAverageLast10Brushings(logs);

    // Get toothbrush days in use
    const toothbrushDaysInUse = await getToothbrushDaysInUse();

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
 * Calculate consecutive days of successful brushing
 */
function calculateStreakDays(logs: any[], userTargetSeconds: number): number {
  if (!logs.length) return 0;

  // Group logs by date
  const logsByDate = new Map<string, any[]>();
  logs.forEach(log => {
    const date = log.date || log.created_at?.slice(0, 10);
    if (!date) return;
    
    if (!logsByDate.has(date)) {
      logsByDate.set(date, []);
    }
    logsByDate.get(date)!.push(log);
  });

  // Check consecutive days starting from today
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const dayLogs = logsByDate.get(dateStr) || [];
    
    // Consider a day successful if user brushed at least once and met target
    const hasSuccessfulBrushing = dayLogs.some(log => {
      return log['duration-seconds'] >= userTargetSeconds;
    });

    if (hasSuccessfulBrushing) {
      streak++;
      currentDate = subDays(currentDate, 1);
    } else {
      break;
    }
  }

  return streak;
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

/**
 * Get toothbrush age in days from local storage
 */
async function getToothbrushDaysInUse(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(TOOTHBRUSH_DATA_KEY);
    if (!stored) return 0;

    const data = JSON.parse(stored);
    if (!data.current?.startDate) return 0;

    const startDate = new Date(data.current.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return days;
  } catch (error) {
    console.error('Error getting toothbrush age:', error);
    return 0;
  }
}

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

  // Authenticated user logic
  try {
    // Fetch the user's specific brushing goal first
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('target_time_in_sec')
      .eq('id', userId)
      .maybeSingle();

    let userTargetMinutes = brushingGoalMinutes;

    if (userError) {
      console.error('Error fetching user target time in streak data:', userError);
    } else if (userData?.target_time_in_sec) {
      userTargetMinutes = userData.target_time_in_sec / 60;
    } else if (userData) {
      // User exists but target_time_in_sec is null, update it to default
      console.log('User exists but target_time_in_sec is null, updating to default...');
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ target_time_in_sec: 120 })
        .eq('id', userId);

      if (!updateError) {
        userTargetMinutes = 2; // 2 minutes
      }
    }
    
    // For now, return the current streak and mock data for history
    // In a real implementation, you'd want to store streak history in the database
    const stats = await getDashboardStats(userId, userTargetMinutes);
    
    return {
      currentStreak: stats.streakDays,
      longestStreak: Math.max(stats.streakDays, 14), // Mock longest streak
      streakHistory: [
        { startDate: '2024-01-01', endDate: '2024-01-14', duration: 14 },
        { startDate: '2023-11-15', endDate: '2023-11-28', duration: 14 },
        { startDate: '2023-09-01', endDate: '2023-09-21', duration: 21 },
      ],
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