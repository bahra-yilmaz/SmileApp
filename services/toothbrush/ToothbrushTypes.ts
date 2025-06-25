// Types related to toothbrush management

/**
 * Represents a single physical toothbrush with its start date.
 */
export interface Toothbrush {
  id: string; // Unique ID for the toothbrush instance
  startDate: string; // ISO string for when this brush was first used
  type: 'manual' | 'electric'; // Type of toothbrush
  purpose?: 'regular' | 'sensitive' | 'braces' | 'whitening'; // New field for purpose
  brand?: string;
  model?: string;
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
