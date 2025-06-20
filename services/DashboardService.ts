import { supabase } from './supabaseClient';
import { subDays, startOfDay, format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}

const TOOTHBRUSH_DATA_KEY = 'toothbrush_data';

/**
 * Fetches all dashboard statistics for the home screen cards
 */
export async function getDashboardStats(userId: string, brushingGoalMinutes: number = 2): Promise<DashboardStats> {
  try {
    // Fetch brushing logs for the past 30 days to calculate stats
    const thirtyDaysAgo = subDays(new Date(), 30);
    const { data: brushingLogs, error } = await supabase
      .from('brushing_logs')
      .select('duration_seconds, target_time_in_sec, date, created_at')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brushing logs:', error);
      throw error;
    }

    const logs = brushingLogs || [];

    // Calculate streak days
    const streakDays = calculateStreakDays(logs, brushingGoalMinutes);

    // Get last brushing time
    const lastBrushingTime = getLastBrushingTime(logs);

    // Calculate average brushing time
    const averageBrushingTime = calculateAverageBrushingTime(logs);

    // Get toothbrush days in use
    const toothbrushDaysInUse = await getToothbrushDaysInUse();

    return {
      streakDays,
      lastBrushingTime,
      toothbrushDaysInUse,
      averageBrushingTime,
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values in case of error
    return {
      streakDays: 0,
      lastBrushingTime: { minutes: 0, seconds: 0 },
      toothbrushDaysInUse: 0,
      averageBrushingTime: { minutes: 0, seconds: 0 },
    };
  }
}

/**
 * Calculate consecutive days of successful brushing
 */
function calculateStreakDays(logs: any[], brushingGoalMinutes: number): number {
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
      const target = log.target_time_in_sec || (brushingGoalMinutes * 60); // Use global goal
      return log.duration_seconds >= target;
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
  const durationInSeconds = lastLog.duration_seconds || 0;
  
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  
  return { minutes, seconds };
}

/**
 * Calculate average brushing time from recent sessions
 */
function calculateAverageBrushingTime(logs: any[]): { minutes: number; seconds: number } {
  if (!logs.length) return { minutes: 0, seconds: 0 };

  const totalSeconds = logs.reduce((sum, log) => sum + (log.duration_seconds || 0), 0);
  const averageSeconds = Math.round(totalSeconds / logs.length);
  
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
  try {
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
  try {
    // For now, return the current streak and mock data for history
    // In a real implementation, you'd want to store streak history in the database
    const stats = await getDashboardStats(userId, brushingGoalMinutes);
    
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