// Core streak data interfaces
export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCalculated: number; // timestamp
  userId?: string;
  aimedSessionsPerDay: number;
}

export interface StreakPeriod {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // days
}

export interface StreakHistory {
  periods: StreakPeriod[];
  lastUpdated: number;
}

export interface StreakSession {
  'duration-seconds': number;
  date?: string; // Make optional to match streakUtils.ts
  created_at?: string; // Make optional to match streakUtils.ts
}

// Comprehensive streak information
export interface ComprehensiveStreakData {
  currentStreak: number;
  longestStreak: number;
  streakHistory: StreakPeriod[];
  currentStreakBrushings: number;
  lastUpdated: number;
}

// Daily goal status
export interface DailyGoalStatus {
  hitGoalToday: boolean;
  sessionsToday: number;
  requiredSessions: number;
  remainingSessions: number;
}

// Streak display information
export interface StreakDisplayInfo {
  title: string;
  description: string;
  phase: string;
  motivationalLevel: 'start' | 'building' | 'strong' | 'champion' | 'master' | 'legendary';
}

// Events for listening to changes
export type StreakEvent = 'streak-updated' | 'streak-calculated' | 'history-updated';

export interface StreakEventData {
  userId: string;
  previousStreak?: number;
  newStreak: number;
  newSession?: StreakSession;
  timestamp: number;
}

// Calculation options
export interface StreakCalculationOptions {
  forceRefresh?: boolean;
  includeToday?: boolean;
}

// Data fetching options
export interface StreakDataOptions {
  forceRefresh?: boolean;
  includeBrushingCount?: boolean;
} 