import { AppImages } from '../utils/loadAssets';
import { PointsStage } from '../services/PointsService';

export interface StageVisualConfig {
  imageKey: keyof typeof AppImages;
  /** percentage from left side of screen – string, e.g. '5%' */
  leftMultiplier: number;
  /** multiplier for mountain height used to calculate bottom offset */
  bottomMultiplier: number;
  /** width & height in px */
  size: number;
}

export const MASCOT_CLIMB_CONFIG: Record<PointsStage, StageVisualConfig> = {
  1: { imageKey: 'nubo-neutral-1', leftMultiplier: 0.08,  bottomMultiplier: 0.27, size: 90 },
  2: { imageKey: 'nubo-neutral-2', leftMultiplier: 0.10, bottomMultiplier: 0.3,  size: 100 },
  3: { imageKey: 'nubo-cool-3',    leftMultiplier: 0.12, bottomMultiplier: 0.32, size: 110 },
  4: { imageKey: 'nubo-cool-4',    leftMultiplier: 0.13, bottomMultiplier: 0.34, size: 120 },
  5: { imageKey: 'nubo-playful-4', leftMultiplier: 0.14, bottomMultiplier: 0.36, size: 125 },
  6: { imageKey: 'nubo-wise-4',    leftMultiplier: 0.15, bottomMultiplier: 0.38, size: 130 },
};

export function getVisualForStage(stage: PointsStage): StageVisualConfig {
  return MASCOT_CLIMB_CONFIG[stage];
} 