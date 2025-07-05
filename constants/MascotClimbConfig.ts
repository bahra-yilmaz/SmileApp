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
  1: { imageKey: 'nubo-climb-1', leftMultiplier: 0.07,  bottomMultiplier: 0.20, size: 85 },
  2: { imageKey: 'nubo-climb-2', leftMultiplier: 0.075, bottomMultiplier: 0.25,  size: 85 },
  3: { imageKey: 'nubo-cool-3',    leftMultiplier: 0.12, bottomMultiplier: 0.32, size: 110 },
  4: { imageKey: 'nubo-cool-4',    leftMultiplier: 0.13, bottomMultiplier: 0.34, size: 120 },
  5: { imageKey: 'nubo-playful-4', leftMultiplier: 0.14, bottomMultiplier: 0.36, size: 125 },
  6: { imageKey: 'nubo-wise-4',    leftMultiplier: 0.15, bottomMultiplier: 0.38, size: 130 },
};

export function getVisualForStage(stage: PointsStage): StageVisualConfig {
  return MASCOT_CLIMB_CONFIG[stage];
} 