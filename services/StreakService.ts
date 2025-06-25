// Legacy StreakService - now redirects to new modular structure
// This file maintains backward compatibility for existing imports

export { 
  StreakService,
  StreakDataService,
  StreakCalculationService,
  StreakDisplayService,
  StreakEventService,
  STREAK_CONFIG,
  STREAK_PHASES
} from './streak';

export type {
  StreakData,
  StreakPeriod,
  StreakHistory,
  StreakSession,
  ComprehensiveStreakData,
  DailyGoalStatus,
  StreakDisplayInfo,
  StreakEvent,
  StreakEventData
} from './streak/StreakTypes';

export type { StreakPhase } from './streak/StreakConfig';

// Re-export the main service as default for backward compatibility
export { StreakService as default } from './streak'; 