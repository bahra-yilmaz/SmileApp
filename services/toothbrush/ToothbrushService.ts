import { v4 as uuidv4 } from 'uuid';
import { Toothbrush, ToothbrushData, ToothbrushUsageStats, ToothbrushDisplayData } from './ToothbrushTypes';
import { ToothbrushRepository } from './ToothbrushRepository';
import { ToothbrushCalculationService } from './ToothbrushCalculationService';
import { ToothbrushDisplayService } from './ToothbrushDisplayService';

/**
 * Clean ToothbrushService - Business Logic Layer
 * 
 * Architecture:
 * - Uses ToothbrushRepository as single source of truth
 * - Focused on business logic, not data access
 * - Clean, predictable API
 * - No overlapping methods
 */
export class ToothbrushService {
  
  /**
   * Resolve user ID - converts 'guest' to actual guest UUID
   */
  private static async resolveUserId(userId: string): Promise<string> {
    // Guest users don't have toothbrush tracking - this is a premium feature
    if (userId === 'guest') {
      throw new Error('Toothbrush tracking is not available for guest users');
    }
    return userId;
  }

  /**
   * Get comprehensive toothbrush information for UI display
   */
  static async getToothbrushInfo(
    userId: string,
    t: (key: string) => string
  ): Promise<{ displayData: ToothbrushDisplayData; stats: ToothbrushUsageStats }> {
    console.log('🦷 Getting toothbrush info for user:', userId);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return {
        displayData: {
          daysInUse: 0,
          healthPercentage: 100,
          healthStatusText: t('toothbrush.guestMode'),
          healthColor: '#9CA3AF',
        },
        stats: {
          totalCalendarDays: 0,
          actualBrushingDays: 0,
          totalBrushingSessions: 0,
          averageBrushingsPerDay: 0,
          usagePercentage: 0,
          replacementStatus: 'brand_new',
        }
      };
    }

    try {
      const toothbrushData = await ToothbrushRepository.getData(userId);
      
      if (!toothbrushData.current) {
        // No toothbrush yet - return default display data
        return {
          displayData: {
            daysInUse: 0,
            healthPercentage: 100,
            healthStatusText: t('toothbrush.status.addToothbrush') || 'Add your toothbrush',
            healthColor: '#9CA3AF',
          },
          stats: {
            totalCalendarDays: 0,
            actualBrushingDays: 0,
            totalBrushingSessions: 0,
            averageBrushingsPerDay: 0,
            usagePercentage: 0,
            replacementStatus: 'brand_new',
          }
        };
      }

      // Calculate stats using the current toothbrush
      const stats = await ToothbrushCalculationService.calculateUsageStats(toothbrushData.current, userId);
      
      // Calculate display data using the stats
      const displayData = ToothbrushDisplayService.getDisplayData(stats, t);

      return { displayData, stats };
    } catch (error) {
      console.error('❌ Error getting toothbrush info:', error);
      
      // Return safe defaults on error
      return {
        displayData: {
          daysInUse: 0,
          healthPercentage: 100,
          healthStatusText: t('common.error') || 'Error',
          healthColor: '#9CA3AF',
        },
        stats: {
          totalCalendarDays: 0,
          actualBrushingDays: 0,
          totalBrushingSessions: 0,
          averageBrushingsPerDay: 0,
          usagePercentage: 0,
          replacementStatus: 'brand_new',
        }
      };
    }
  }

  /**
   * Get comprehensive toothbrush information from already calculated stats (for caching)
   */
  static async getToothbrushInfoFromStats(
    userId: string,
    t: (key: string) => string,
    stats: ToothbrushUsageStats
  ): Promise<{ displayData: ToothbrushDisplayData; stats: ToothbrushUsageStats }> {
    // For guests or if stats are somehow invalid, return default guest/error state
    if (userId === 'guest' || !stats) {
      return this.getToothbrushInfo(userId, t);
    }
    
    // Generate display data from the provided stats
    const displayData = ToothbrushDisplayService.getDisplayData(stats, t);
    
    return { displayData, stats };
  }

  /**
   * Replace the current toothbrush with a new one
   */
  static async replaceToothbrush(
    userId: string,
    details: {
      type: 'manual' | 'electric';
      purpose?: 'regular' | 'sensitive' | 'braces' | 'whitening';
      name?: string;
      ageDays?: number;
    }
  ): Promise<void> {
    console.log('🔄 Replacing toothbrush for user:', userId, details);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      throw new Error('Toothbrush tracking is not available for guest users');
    }

    try {
      // Get current data
      const currentData = await ToothbrushRepository.getData(userId);
      const oldBrush = currentData.current;

      // Calculate start date based on age
      const startDate = details.ageDays && details.ageDays > 0
        ? new Date(Date.now() - (details.ageDays * 24 * 60 * 60 * 1000)).toISOString()
        : new Date().toISOString();

      // Create new toothbrush
      const newBrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        startDate,
        type: details.type,
        purpose: details.purpose || 'regular',
        name: details.name,
        created_at: new Date().toISOString(),
      };

      // Move old brush to history with end date
      const newHistory = oldBrush 
        ? [...currentData.history, { ...oldBrush, endDate: new Date().toISOString() }] 
        : currentData.history;

      const newData: ToothbrushData = {
        current: newBrush,
        history: newHistory,
      };

      // Save to repository (handles both backend and local cache)
      await ToothbrushRepository.saveData(userId, newData);

      console.log('✅ Successfully replaced toothbrush');
    } catch (error) {
      console.error('❌ Error replacing toothbrush:', error);
      throw error;
    }
  }

  /**
   * Create the first toothbrush for new users
   */
  static async createFirstBrush(
    userId: string,
    t: (key: string) => string,
    startDate?: string | null
  ): Promise<void> {
    console.log('🆕 Creating first brush for user:', userId, 'with startDate:', startDate);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      console.log('🚫 Guest users do not get automatic first brush creation');
      return;
    }

    try {
      // Check if user already has a toothbrush
      const existingData = await ToothbrushRepository.getData(userId);
      if (existingData.current) {
        console.log('User already has a toothbrush, skipping creation');
        return;
      }

      // Use provided start date if available, otherwise use current date
      const toothbrushStartDate = startDate || new Date().toISOString();

      // Create the first brush
      const firstBrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        startDate: toothbrushStartDate,
        type: 'manual',
        purpose: 'regular',
        name: t('settings.firstBrush'),
        created_at: new Date().toISOString(),
      };

      const newData: ToothbrushData = {
        current: firstBrush,
        history: [],
      };

      await ToothbrushRepository.saveData(userId, newData);
      console.log('✅ First brush created successfully with start date:', toothbrushStartDate);
    } catch (error) {
      console.error('❌ Error creating first brush:', error);
      // Don't throw - this shouldn't break user flow
    }
  }

  /**
   * Get current toothbrush object
   */
  static async getCurrentToothbrush(userId: string): Promise<Toothbrush | null> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return null;
    }

    try {
      const data = await ToothbrushRepository.getData(userId);
      return data.current;
    } catch (error) {
      console.error('❌ Error getting current toothbrush:', error);
      return null;
    }
  }

  /**
   * Get all toothbrush data including history
   */
  static async getAllToothbrushData(userId: string): Promise<ToothbrushData> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return { current: null, history: [] };
    }

    try {
      return await ToothbrushRepository.getData(userId);
    } catch (error) {
      console.error('❌ Error getting all toothbrush data:', error);
      return { current: null, history: [] };
    }
  }

  /**
   * Delete a toothbrush from history
   */
  static async deleteFromHistory(userId: string, toothbrushId: string): Promise<void> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      throw new Error('Toothbrush tracking is not available for guest users');
    }

    try {
      // Delete from backend
      await ToothbrushRepository.deleteFromHistory(toothbrushId);
      
      // Refresh local cache
      await ToothbrushRepository.getData(userId);
      
      console.log('✅ Deleted toothbrush from history:', toothbrushId);
    } catch (error) {
      console.error('❌ Error deleting from history:', error);
      throw error;
    }
  }

  /**
   * Get simple days in use for current toothbrush
   */
  static async getSimpleDaysInUse(userId: string): Promise<number> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return 0;
    }

    try {
      const data = await ToothbrushRepository.getData(userId);
      if (!data.current) return 0;

      const stats = await ToothbrushCalculationService.calculateUsageStats(data.current, userId);
      return stats.totalCalendarDays;
    } catch (error) {
      console.error('❌ Error getting days in use:', error);
      return 0;
    }
  }

  /**
   * Link a brushing session to the current toothbrush
   */
  static async linkBrushingSession(userId: string, brushingLogId: string): Promise<void> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      console.log('🚫 Guest users do not have toothbrush linking');
      return;
    }

    try {
      await ToothbrushRepository.linkBrushingSession(userId, brushingLogId);
    } catch (error) {
      console.error('❌ Error linking brushing session:', error);
      // Don't throw - this is not critical for the main flow
    }
  }

  /**
   * Get brushing count for a specific toothbrush
   */
  static async getBrushingCount(userId: string, toothbrushId: string): Promise<number> {
    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return 0;
    }

    try {
      return await ToothbrushRepository.getBrushingCount(userId, toothbrushId);
    } catch (error) {
      console.error('❌ Error getting brushing count:', error);
      return 0;
    }
  }
} 