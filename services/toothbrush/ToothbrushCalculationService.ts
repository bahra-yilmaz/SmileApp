import { Toothbrush, ToothbrushUsageStats } from './ToothbrushTypes';
import { ToothbrushDataService } from './ToothbrushDataService';
import { getLocalDateString, getTodayLocalString } from '../../utils/dateUtils';
import { differenceInCalendarDays } from 'date-fns';

/**
 * Service for handling all business logic related to toothbrush stats.
 */
export class ToothbrushCalculationService {
  /**
   * Calculates detailed usage statistics for a given toothbrush and user.
   */
  static async calculateUsageStats(
    toothbrush: Toothbrush,
    userId: string
  ): Promise<ToothbrushUsageStats> {
    try {
      const startDate = new Date(toothbrush.startDate);
      const today = new Date();

      // 1. Calculate total calendar days since the toothbrush was started
      const totalCalendarDays = differenceInCalendarDays(today, startDate) + 1;

      // 2. Get all brushing logs within the toothbrush's usage period
      const brushingLogs = await ToothbrushDataService.getBrushingLogsForPeriod(
        userId,
        getLocalDateString(startDate),
        getTodayLocalString()
      );

      // 3. Calculate the number of unique days the user actually brushed
      const brushingDaysSet = new Set(brushingLogs.map(log => log.date || log.created_at?.slice(0, 10)));
      const actualBrushingDays = brushingDaysSet.size;

      // 4. Calculate total brushing sessions
      const totalBrushingSessions = brushingLogs.length;

      // 5. Calculate average brushings per day (only on days the user brushed)
      const averageBrushingsPerDay =
        actualBrushingDays > 0 ? totalBrushingSessions / actualBrushingDays : 0;

      // 6. Calculate the percentage of days the toothbrush was used
      const usagePercentage =
        totalCalendarDays > 0 ? (actualBrushingDays / totalCalendarDays) * 100 : 0;
        
      // 7. Determine the last used date
      const lastUsedDate = brushingLogs.length > 0 
        ? brushingLogs[brushingLogs.length - 1].date || brushingLogs[brushingLogs.length - 1].created_at?.slice(0, 10)
        : undefined;

      // 8. Determine the replacement status based on calendar days
      const replacementStatus = this.getReplacementStatus(totalCalendarDays);

      return {
        totalCalendarDays,
        actualBrushingDays,
        totalBrushingSessions,
        averageBrushingsPerDay: Math.round(averageBrushingsPerDay * 10) / 10,
        usagePercentage: Math.round(usagePercentage),
        lastUsedDate,
        replacementStatus,
      };
    } catch (error) {
      console.error('Error calculating toothbrush stats:', error);
      // Return a default state in case of an error
      return {
        totalCalendarDays: 0,
        actualBrushingDays: 0,
        totalBrushingSessions: 0,
        averageBrushingsPerDay: 0,
        usagePercentage: 0,
        replacementStatus: 'brand_new',
      };
    }
  }

  /**
   * Determines the replacement status of a toothbrush based on its age in days.
   */
  private static getReplacementStatus(
    totalDays: number
  ): ToothbrushUsageStats['replacementStatus'] {
    // Note: This logic will be used by the DisplayService to get color and text
    if (totalDays < 7) return 'brand_new';
    if (totalDays < 30) return 'fresh';
    if (totalDays < 60) return 'good';
    if (totalDays < 90) return 'replace_soon';
    return 'overdue';
  }
}
