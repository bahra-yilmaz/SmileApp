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
 * Get the current date string in local timezone
 * Use this instead of toISOString().slice(0, 10) for date calculations
 */
export function getTodayLocalString(): string {
  return getLocalDateString(new Date());
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