// Main service
export { StreakService } from './StreakService';

// Individual service modules
export { StreakDataService } from './StreakDataService';
export { StreakCalculationService } from './StreakCalculationService';
export { StreakDisplayService } from './StreakDisplayService';
export { StreakEventService } from './StreakEventService';

// Configuration and types
export { STREAK_CONFIG, STREAK_PHASES } from './StreakConfig';
export type { StreakPhase } from './StreakConfig';
export * from './StreakTypes';

// Service factory and utilities
export { 
  StreakServiceFactory, 
  createStreakService, 
  createStreakServiceWithDebug 
} from './StreakServiceFactory';
export type { StreakServiceConfig } from './StreakServiceFactory'; 