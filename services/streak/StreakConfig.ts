// Streak configuration and constants
export const STREAK_CONFIG = {
  // Cache settings
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutes
  
  // Storage keys
  STORAGE_KEYS: {
    STREAK_CACHE: 'streak_cache_v1',
    STREAK_HISTORY: 'streak_history_v1',
  } as const,
  
  // Streak milestones for responsive titles
  MILESTONES: {
    START: 0,
    FIRST_DAY: 1,
    EARLY_PHASE: 3,
    ONE_WEEK: 7,
    TWO_WEEKS: 14,
    ONE_MONTH: 30,
    TWO_MONTHS: 60,
    CENTURY: 100,
  } as const,
  
  // Default values
  DEFAULTS: {
    DAILY_BRUSHING_TARGET: 2,
    STREAK_PHASE_LENGTH: 7,
  } as const,
} as const;

// Streak milestone ranges for responsive UI
export const STREAK_PHASES = {
  START: { min: 0, max: 0 },
  FIRST: { min: 1, max: 1 },
  EARLY: { min: 2, max: STREAK_CONFIG.MILESTONES.EARLY_PHASE },
  WEEK: { min: STREAK_CONFIG.MILESTONES.EARLY_PHASE + 1, max: STREAK_CONFIG.MILESTONES.ONE_WEEK },
  TWO_WEEKS: { min: STREAK_CONFIG.MILESTONES.ONE_WEEK + 1, max: STREAK_CONFIG.MILESTONES.TWO_WEEKS },
  MONTH: { min: STREAK_CONFIG.MILESTONES.TWO_WEEKS + 1, max: STREAK_CONFIG.MILESTONES.ONE_MONTH },
  TWO_MONTHS: { min: STREAK_CONFIG.MILESTONES.ONE_MONTH + 1, max: STREAK_CONFIG.MILESTONES.TWO_MONTHS },
  HUNDRED: { min: STREAK_CONFIG.MILESTONES.TWO_MONTHS + 1, max: STREAK_CONFIG.MILESTONES.CENTURY },
  LEGENDARY: { min: STREAK_CONFIG.MILESTONES.CENTURY + 1, max: Infinity },
} as const;

export type StreakPhase = keyof typeof STREAK_PHASES; 