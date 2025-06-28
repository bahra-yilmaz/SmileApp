import { Toothbrush, ToothbrushUsageStats } from './ToothbrushTypes';
import { supabase } from '../supabaseClient';
import { differenceInDays } from 'date-fns';

/**
 * Service for calculating toothbrush usage statistics
 * Now uses the brushing_count column for accurate and fast calculations
 */
export class ToothbrushCalculationService {

  /**
   * Calculate comprehensive usage statistics for a toothbrush
   * Uses the new brushing_count column for accurate and fast calculations
   */
  static async calculateUsageStats(
    toothbrush: Toothbrush,
    userId: string
  ): Promise<ToothbrushUsageStats> {
    console.log('🧮 Calculating usage stats for toothbrush:', toothbrush.id);

    try {
      // Calculate basic metrics
      const startDate = new Date(toothbrush.startDate);
      const endDate = toothbrush.endDate ? new Date(toothbrush.endDate) : new Date();
      const totalCalendarDays = Math.max(0, differenceInDays(endDate, startDate));

      // Get brushing count directly from the toothbrush record (fast!)
      const { data: toothbrushData, error } = await supabase
        .from('toothbrushes')
        .select('brushing_count')
        .eq('id', toothbrush.id)
        .single();

      if (error) {
        console.error('❌ Error fetching toothbrush count:', error);
        throw error;
      }

      const totalBrushingSessions = toothbrushData?.brushing_count || 0;

      // Calculate actual brushing days (unique dates with brushing sessions)
      // Note: This still requires a query, but only for unique dates, not counting
      const { data: uniqueDates, error: datesError } = await supabase
        .from('brushing_logs')
        .select('date')
        .eq('user_id', userId)
        .gte('date', toothbrush.startDate.split('T')[0]) // Convert ISO to date
        .lte('date', toothbrush.endDate ? toothbrush.endDate.split('T')[0] : new Date().toISOString().split('T')[0])
        .order('date');

      if (datesError) {
        console.warn('⚠️ Error fetching unique brushing dates, using fallback:', datesError);
      }

      // Count unique dates
      const uniqueDateSet = new Set(uniqueDates?.map(d => d.date) || []);
      const actualBrushingDays = uniqueDateSet.size;

      // Calculate derived metrics
      const averageBrushingsPerDay = totalCalendarDays > 0 
        ? totalBrushingSessions / totalCalendarDays 
        : 0;

      const usagePercentage = totalCalendarDays > 0 
        ? (actualBrushingDays / totalCalendarDays) * 100 
        : 0;
        
      // Determine replacement status based on usage
      let replacementStatus: 'brand_new' | 'fresh' | 'good' | 'replace_soon' | 'overdue';
      
      if (totalCalendarDays === 0) {
        replacementStatus = 'brand_new'; // Brand new toothbrush created today
      } else if (totalCalendarDays <= 7) {
        replacementStatus = 'brand_new';
      } else if (totalCalendarDays <= 30) {
        replacementStatus = 'fresh';
      } else if (totalCalendarDays <= 60) {
        replacementStatus = 'good';
      } else if (totalCalendarDays <= 90) {
        replacementStatus = 'replace_soon';
      } else {
        replacementStatus = 'overdue';
      }

      const stats: ToothbrushUsageStats = {
        totalCalendarDays,
        actualBrushingDays,
        totalBrushingSessions,
        averageBrushingsPerDay: Math.round(averageBrushingsPerDay * 100) / 100,
        usagePercentage: Math.round(usagePercentage * 100) / 100,
        replacementStatus,
      };

      console.log('✅ Calculated usage stats:', stats);
      return stats;

    } catch (error) {
      console.error('❌ Error calculating toothbrush usage stats:', error);
      
      // Return safe defaults on error
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
   * Calculate simple days in use for a toothbrush
   */
  static calculateDaysInUse(toothbrush: Toothbrush): number {
    const startDate = new Date(toothbrush.startDate);
    const endDate = toothbrush.endDate ? new Date(toothbrush.endDate) : new Date();
    return Math.max(0, differenceInDays(endDate, startDate));
  }
}
