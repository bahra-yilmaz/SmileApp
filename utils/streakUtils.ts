import { subDays } from 'date-fns';
import { getHabitDayString, getTodayHabitString } from './dateUtils';

/**
 * Represents a single brushing session.
 * The `created_at` or `date` field is essential for grouping by day.
 */
export interface StreakSession {
  'duration-seconds': number;
  created_at?: string; // ISO string format
  date?: string; // YYYY-MM-DD format
}

/**
 * Calculates the current streak based on a list of brushing sessions.
 * A day is considered successful if the number of sessions for that day
 * meets or exceeds the `aimedSessionsPerDay`.
 *
 * The streak is the number of consecutive successful days, counting backwards
 * from today. For the current day, it provides a "grace period" - if today's
 * target isn't met yet, it shows the previous streak rather than resetting to 0.
 *
 * @param sessions - An array of brushing session objects.
 * @param aimedSessionsPerDay - The target number of brushing sessions per day.
 * @param includeCurrentDayGracePeriod - Whether to give grace period for current day (default: true)
 * @returns The current streak in days.
 */
export function calculateStreak(
  sessions: StreakSession[],
  aimedSessionsPerDay: number,
  includeCurrentDayGracePeriod: boolean = true
): number {
  if (!sessions.length || aimedSessionsPerDay <= 0) {
    return 0;
  }

  // Group logs by HABIT day string (YYYY-MM-DD) so that both grouping and
  // later look-ups use the SAME key. This prevents off-by-one errors around
  // the 3 AM reset boundary.
  const logsByDate = new Map<string, StreakSession[]>();

  const getSessionHabitDay = (session: StreakSession): string | null => {
    const rawDateStr = session.date || session.created_at;
    if (!rawDateStr) return null;

    // We intentionally run the value through getHabitDayString so that
    // sessions logged between 00:00-02:59 are attributed to the previous
    // habit day, matching the logic used later when iterating over days.
    return getHabitDayString(new Date(rawDateStr));
  };

  sessions.forEach(session => {
    const habitDay = getSessionHabitDay(session);
    if (!habitDay) return;

    if (!logsByDate.has(habitDay)) {
      logsByDate.set(habitDay, []);
    }
    logsByDate.get(habitDay)!.push(session);
  });

  const getLocalKey = (d: Date) => getHabitDayString(d);

  // Check consecutive days starting from today
  let streak = 0;
  let currentDate = new Date(); // Starts with today in local time
  let isFirstDay = true; // Track if we're checking today

  while (true) {
    const dateStr = getLocalKey(currentDate);
    const dayLogs = logsByDate.get(dateStr) || [];

    // A day is successful if the user brushed at least the aimed number of times.
    const isSuccessfulDay = dayLogs.length >= aimedSessionsPerDay;

    if (isSuccessfulDay) {
      streak++;
      // Move to the previous day
      currentDate = subDays(currentDate, 1);
      isFirstDay = false;
    } else {
      // If this is today and we're using grace period, check yesterday instead
      if (isFirstDay && includeCurrentDayGracePeriod) {
        // Today hasn't met target yet, but we give grace period
        // Skip today and start counting from yesterday
        currentDate = subDays(currentDate, 1);
        isFirstDay = false;
        continue;
      } else {
        // Streak is broken (either not today, or grace period disabled)
        break;
      }
    }
  }

  return streak;
}

/**
 * Get detailed streak information including current day progress
 */
export interface StreakStatus {
  currentStreak: number;
  streakIncludingToday: number; // What the streak would be if today is completed
  todaySessionsCount: number;
  todaySessionsNeeded: number;
  todayCompleted: boolean;
  isStreakContinuing: boolean; // Whether the streak is continuing or on grace period
}

/**
 * Get detailed streak status including current day progress
 */
export function getStreakStatus(
  sessions: StreakSession[],
  aimedSessionsPerDay: number
): StreakStatus {
  if (!sessions.length || aimedSessionsPerDay <= 0) {
    return {
      currentStreak: 0,
      streakIncludingToday: 0,
      todaySessionsCount: 0,
      todaySessionsNeeded: aimedSessionsPerDay,
      todayCompleted: false,
      isStreakContinuing: false
    };
  }

  // Get today's sessions (using habit day logic with 3:00 AM reset)
  const today = getTodayHabitString();
  const todaySessions = sessions.filter(session => {
    const sessionDate = session.date || session.created_at?.slice(0, 10);
    return sessionDate === today;
  });

  const todaySessionsCount = todaySessions.length;
  const todayCompleted = todaySessionsCount >= aimedSessionsPerDay;

  // Calculate streak with and without grace period
  const currentStreak = calculateStreak(sessions, aimedSessionsPerDay, true); // With grace period
  const strictStreak = calculateStreak(sessions, aimedSessionsPerDay, false); // Without grace period
  
  // If today is completed, the streak including today would be strict streak
  // If today is not completed, it would be the same as current (grace period) streak
  const streakIncludingToday = todayCompleted ? strictStreak : currentStreak;

  return {
    currentStreak,
    streakIncludingToday,
    todaySessionsCount,
    todaySessionsNeeded: Math.max(0, aimedSessionsPerDay - todaySessionsCount),
    todayCompleted,
    isStreakContinuing: todayCompleted || currentStreak > strictStreak
  };
} 