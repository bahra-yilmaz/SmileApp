import { Colors } from '../constants/Colors';

/**
 * Returns a color based on progress percentage.
 *  - Success (>= 100%) → primary[200]
 *  - Warning (60-99%) → feedback.warning.light
 *  - Error (< 60%)    → feedback.error.light
 */
export function getProgressColor(progressPct: number): string {
  // Before reaching goal use gentle primary tint, on/after goal use strong primary 500
  return progressPct >= 90 ? Colors.primary[500] : Colors.primary[300];
} 