/**
 * Toothbrush Module - Clean, Modular Architecture
 * 
 * Structure:
 * - ToothbrushService: Business logic layer
 * - ToothbrushRepository: Data access layer (backend + cache)
 * - ToothbrushCalculationService: Stats calculations
 * - ToothbrushDisplayService: UI display helpers
 * - ToothbrushTypes: Type definitions
 */

// Export all toothbrush-related services and types
export { ToothbrushService } from './ToothbrushService';
export { ToothbrushRepository } from './ToothbrushRepository';
export { ToothbrushDataService } from './ToothbrushDataService';
export { ToothbrushCalculationService } from './ToothbrushCalculationService';
export { ToothbrushDisplayService } from './ToothbrushDisplayService';
export { ToothbrushMigrationService } from './ToothbrushMigrationService';

export type {
  Toothbrush,
  ToothbrushData,
  ToothbrushUsageStats,
  ToothbrushDisplayData,
} from './ToothbrushTypes';

// Export types
export * from './ToothbrushTypes';
export * from './ToothbrushConfig'; 