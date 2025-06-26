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

// Export the new clean service as the main API
export { ToothbrushService } from './ToothbrushService';

// Export repository for advanced use cases
export { ToothbrushRepository } from './ToothbrushRepository';

// Export supporting services
export { ToothbrushCalculationService } from './ToothbrushCalculationService';
export { ToothbrushDisplayService } from './ToothbrushDisplayService';

// Export types
export * from './ToothbrushTypes';
export * from './ToothbrushConfig';

// Legacy compatibility exports (these can be removed later)
export { ToothbrushDataService } from './ToothbrushDataService'; 