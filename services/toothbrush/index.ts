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
export { ToothbrushDataService } from './ToothbrushDataService';
export { ToothbrushCalculationService } from './ToothbrushCalculationService';
export { ToothbrushDisplayService } from './ToothbrushDisplayService';
export { ToothbrushRepository } from './ToothbrushRepository';
export { ToothbrushMigrationService } from './ToothbrushMigrationService';
export { ApproximateBrushingCalculator } from './ApproximateBrushingCalculator';

export type {
  Toothbrush,
  ToothbrushData,
  ToothbrushUsageStats,
  ToothbrushDisplayData,
} from './ToothbrushTypes';

// Export types
export * from './ToothbrushTypes';
export * from './ToothbrushConfig'; 