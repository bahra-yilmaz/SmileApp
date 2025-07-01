import { supabase } from '../supabaseClient';
import { GuestUserService } from '../GuestUserService';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface MonthlyBrushStats {
  currentMonthBrushes: number;
  targetMonth: string; // yyyy-MM format
  isCurrentMonth: boolean;
}

/**
 * Service for tracking monthly brushing counts
 * Handles both authenticated and guest users
 */
export class MonthlyBrushService {
  
  /**
   * Get the current month's brush count for a user
   */
  static async getCurrentMonthBrushCount(userId: string): Promise<number> {
    try {
      // Handle guest users
      if (userId === 'guest') {
        return await this.getGuestMonthlyCount();
      }

      // Authenticated users - query database
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      const { data: brushingLogs, error } = await supabase
        .from('brushing_logs')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) {
        console.error('❌ Error fetching monthly brush count:', error);
        return 0;
      }

      const count = brushingLogs?.length || 0;
      console.log(`📅 Monthly brush count for ${format(now, 'yyyy-MM')}: ${count}`);
      
      return count;
    } catch (error) {
      console.error('❌ Error in getCurrentMonthBrushCount:', error);
      return 0;
    }
  }

  /**
   * Get monthly brush stats with additional metadata
   */
  static async getMonthlyStats(userId: string, targetDate?: Date): Promise<MonthlyBrushStats> {
    const date = targetDate || new Date();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const isCurrentMonth = format(date, 'yyyy-MM') === format(new Date(), 'yyyy-MM');

    try {
      let brushCount = 0;

      if (userId === 'guest') {
        brushCount = await this.getGuestMonthlyCount(date);
      } else {
        const { data: brushingLogs, error } = await supabase
          .from('brushing_logs')
          .select('id')
          .eq('user_id', userId)
          .gte('created_at', monthStart.toISOString())
          .lte('created_at', monthEnd.toISOString());

        if (error) {
          console.error('❌ Error fetching monthly stats:', error);
        } else {
          brushCount = brushingLogs?.length || 0;
        }
      }

      return {
        currentMonthBrushes: brushCount,
        targetMonth: format(date, 'yyyy-MM'),
        isCurrentMonth,
      };
    } catch (error) {
      console.error('❌ Error in getMonthlyStats:', error);
      return {
        currentMonthBrushes: 0,
        targetMonth: format(date, 'yyyy-MM'),
        isCurrentMonth,
      };
    }
  }

  /**
   * Get guest user's monthly brush count
   */
  private static async getGuestMonthlyCount(targetDate?: Date): Promise<number> {
    try {
      const date = targetDate || new Date();
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      // Get guest user ID to query their data directly
      const guestUserId = await GuestUserService.getCurrentGuestUserId();
      if (!guestUserId) {
        return 0;
      }

      // Query guest brushing logs for the target month
      const { data: brushingLogs, error } = await supabase
        .from('brushing_logs')
        .select('id')
        .eq('user_id', guestUserId)
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      if (error) {
        console.error('❌ Error fetching guest monthly count:', error);
        return 0;
      }

      const count = brushingLogs?.length || 0;
      console.log(`👻 Guest monthly brush count for ${format(date, 'yyyy-MM')}: ${count}`);
      return count;
    } catch (error) {
      console.error('❌ Error fetching guest monthly count:', error);
      return 0;
    }
  }

  /**
   * Check if user has reached exactly N brushes this month
   */
  static async hasReachedMonthlyTarget(userId: string, targetCount: number): Promise<boolean> {
    const currentCount = await this.getCurrentMonthBrushCount(userId);
    return currentCount === targetCount;
  }

  /**
   * Get the user's monthly brushing progress
   */
  static async getMonthlyProgress(userId: string, targetPerMonth: number = 60): Promise<{
    current: number;
    target: number;
    percentage: number;
    remaining: number;
  }> {
    const current = await this.getCurrentMonthBrushCount(userId);
    const percentage = Math.min(100, Math.round((current / targetPerMonth) * 100));
    const remaining = Math.max(0, targetPerMonth - current);

    return {
      current,
      target: targetPerMonth,
      percentage,
      remaining,
    };
  }
} 