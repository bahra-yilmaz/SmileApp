import { TOOTHBRUSH_CONFIG } from './ToothbrushConfig';
import { ToothbrushDisplayData, ToothbrushUsageStats } from './ToothbrushTypes';
import { useTranslation } from 'react-i18next';

/**
 * Service for formatting toothbrush data for display in the UI.
 */
export class ToothbrushDisplayService {
  /**
   * Generates all the necessary display data for the toothbrush UI components.
   * @param stats - The calculated usage statistics for the toothbrush.
   * @param t - The translation function from i18next.
   * @returns An object with all the data needed for UI rendering.
   */
  static getDisplayData(
    stats: ToothbrushUsageStats | null,
    t: (key: string) => string
  ): ToothbrushDisplayData {
    if (!stats) {
      // Return default/empty state if no stats are available
      return {
        healthPercentage: 100,
        healthColor: TOOTHBRUSH_CONFIG.HEALTH_COLORS.BRAND_NEW,
        healthStatusText: t('toothbrush.status.brand_new'),
        daysInUse: 0,
      };
    }

    const { totalCalendarDays, replacementStatus } = stats;

    // Calculate health percentage (as a percentage of life remaining)
    const healthPercentage = Math.max(
      0,
      100 - (totalCalendarDays / TOOTHBRUSH_CONFIG.LIFESPAN_DAYS) * 100
    );

    // Get color and text based on the current replacement status
    const healthColor = this.getStatusColor(replacementStatus);
    const healthStatusText = this.getStatusText(replacementStatus, t);

    return {
      healthPercentage: Math.round(healthPercentage),
      healthColor,
      healthStatusText,
      daysInUse: totalCalendarDays,
    };
  }

  /**
   * Gets the corresponding color for a given replacement status.
   */
  static getStatusColor(status: ToothbrushUsageStats['replacementStatus']): string {
    const statusToColorMap: Record<
      ToothbrushUsageStats['replacementStatus'],
      string
    > = {
      brand_new: TOOTHBRUSH_CONFIG.HEALTH_COLORS.BRAND_NEW,
      fresh: TOOTHBRUSH_CONFIG.HEALTH_COLORS.FRESH,
      good: TOOTHBRUSH_CONFIG.HEALTH_COLORS.GOOD,
      replace_soon: TOOTHBRUSH_CONFIG.HEALTH_COLORS.REPLACE_SOON,
      overdue: TOOTHBRUSH_CONFIG.HEALTH_COLORS.OVERDUE,
    };
    return statusToColorMap[status];
  }

  /**
   * Gets the translated text for a given replacement status.
   */
  static getStatusText(
    status: ToothbrushUsageStats['replacementStatus'],
    t: (key: string) => string
  ): string {
    const statusToKeyMap: Record<ToothbrushUsageStats['replacementStatus'], string> = {
      brand_new: 'toothbrush.status.brand_new',
      fresh: 'toothbrush.status.fresh',
      good: 'toothbrush.status.good',
      replace_soon: 'toothbrush.status.replace_soon',
      overdue: 'toothbrush.status.overdue',
    };
    return t(statusToKeyMap[status]);
  }
}
