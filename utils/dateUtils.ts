/**
 * Configuration for habit day calculation
 */
export const HABIT_DAY_CONFIG = {
  RESET_HOUR: 3, // 3:00 AM reset time
} as const;

/**
 * Get the current date in local timezone formatted as YYYY-MM-DD
 * This ensures consistency between calendar view and brushing logs
 * to prevent date mismatches around midnight in different timezones
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the habit day string for a given date, accounting for the 3:00 AM reset time
 * If the time is between 00:00 and 02:59, it's considered the previous day for habits
 */
export function getHabitDayString(date: Date = new Date()): string {
  const adjustedDate = new Date(date);
  
  // If it's before 3:00 AM, consider it the previous day for habit tracking
  if (adjustedDate.getHours() < HABIT_DAY_CONFIG.RESET_HOUR) {
    adjustedDate.setDate(adjustedDate.getDate() - 1);
  }
  
  return getLocalDateString(adjustedDate);
}

/**
 * Get the current date string in local timezone
 * Use this instead of toISOString().slice(0, 10) for date calculations
 */
export function getTodayLocalString(): string {
  return getLocalDateString(new Date());
}

/**
 * Get the current habit day string (accounting for 3:00 AM reset)
 * Use this for streak calculations and habit tracking
 */
export function getTodayHabitString(): string {
  return getHabitDayString(new Date());
}

/**
 * Convert a date to local timezone string
 * Use this for consistent date formatting across the app
 */
export function toLocalDateString(date: Date | string): string {
  if (typeof date === 'string') {
    return getLocalDateString(new Date(date));
  }
  return getLocalDateString(date);
}

/**
 * Convert a date to habit day string (accounting for 3:00 AM reset)
 * Use this for habit tracking and streak calculations
 */
export function toHabitDayString(date: Date | string): string {
  if (typeof date === 'string') {
    return getHabitDayString(new Date(date));
  }
  return getHabitDayString(date);
} 