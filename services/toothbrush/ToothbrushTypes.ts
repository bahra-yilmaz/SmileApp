// Types related to toothbrush management

/**
 * Represents a single physical toothbrush with its start date.
 */
export interface Toothbrush {
  id: string; // Unique ID for the toothbrush instance
  user_id: string;
  name?: string; // User-provided name for the toothbrush
  startDate: string; // ISO string for when this brush was first used
  endDate?: string; // ISO 8601, only for history items
  type: 'manual' | 'electric'; // Type of toothbrush
  purpose: 'regular' | 'braces' | 'sensitive' | 'whitening';
  created_at: string;
}

/**
 * Represents the overall toothbrush data for a user,
 * including their current brush and replacement history.
 */
export interface ToothbrushData {
  current: Toothbrush | null;
  history: Toothbrush[];
}

/**
 * Defines the detailed usage statistics calculated for a toothbrush.
 */
export interface ToothbrushUsageStats {
  totalCalendarDays: number;
  actualBrushingDays: number;
  totalBrushingSessions: number;
  averageBrushingsPerDay: number;
  usagePercentage: number; // % of calendar days the user actually brushed
  lastUsedDate?: string;
  replacementStatus: 'brand_new' | 'fresh' | 'good' | 'replace_soon' | 'overdue';
}

/**
 * Defines the shape of the data for displaying toothbrush health.
 */
export interface ToothbrushDisplayData {
  healthPercentage: number;
  healthColor: string;
  healthStatusText: string; // e.g., "Good", "Replace Soon"
  daysInUse: number;
}
