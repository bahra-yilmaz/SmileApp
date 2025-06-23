import { subDays } from 'date-fns';
import { getLocalDateString } from './dateUtils';

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
 * from today (in UTC).
 *
 * @param sessions - An array of brushing session objects.
 * @param aimedSessionsPerDay - The target number of brushing sessions per day.
 * @returns The current streak in days.
 */
export function calculateStreak(
  sessions: StreakSession[],
  aimedSessionsPerDay: number
): number {
  if (!sessions.length || aimedSessionsPerDay <= 0) {
    return 0;
  }

  // Group logs by UTC date string (YYYY-MM-DD)
  const logsByDate = new Map<string, StreakSession[]>();
  sessions.forEach(log => {
    // Prefer the `date` field if available, otherwise parse from `created_at`
    const date = log.date || log.created_at?.slice(0, 10);
    if (!date) return;

    if (!logsByDate.has(date)) {
      logsByDate.set(date, []);
    }
    logsByDate.get(date)!.push(log);
  });

  const getLocalKey = (d: Date) => getLocalDateString(d);

  // Check consecutive days starting from today
  let streak = 0;
  let currentDate = new Date(); // Starts with today in local time

  while (true) {
    const dateStr = getLocalKey(currentDate);
    const dayLogs = logsByDate.get(dateStr) || [];

    // A day is successful if the user brushed at least the aimed number of times.
    // The duration of each session does not matter for the streak calculation.
    const isSuccessfulDay = dayLogs.length >= aimedSessionsPerDay;

    if (isSuccessfulDay) {
      streak++;
      // Move to the previous day
      currentDate = subDays(currentDate, 1);
    } else {
      // Streak is broken
      break;
    }
  }

  return streak;
} 