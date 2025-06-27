import { v4 as uuidv4 } from 'uuid';
import { Toothbrush, ToothbrushData, ToothbrushUsageStats, ToothbrushDisplayData } from './ToothbrushTypes';
import { ToothbrushRepository } from './ToothbrushRepository';
import { ToothbrushCalculationService } from './ToothbrushCalculationService';
import { ToothbrushDisplayService } from './ToothbrushDisplayService';
import { eventBus } from '../../utils/EventBus';
import { ToothbrushDataService } from './ToothbrushDataService';
import { ToothbrushMigrationService } from './ToothbrushMigrationService';

/**
 * Clean ToothbrushService - Business Logic Layer
 * 
 * Architecture:
 * - Uses ToothbrushRepository as single source of truth
 * - Focused on business logic, not data access
 * - Clean, predictable API
 * - No overlapping methods
 * - Includes automatic migration to new counter system
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
   * Ensure user is migrated to the new counter system
   * Called automatically before any toothbrush operations
   */
  private static async ensureMigration(userId: string): Promise<void> {
    if (userId === 'guest') return;
    
    try {
      await ToothbrushMigrationService.migrateUserToothbrushes(userId);
    } catch (error) {
      console.error('❌ Migration failed, but continuing with operation:', error);
      // Don't throw - migration failure shouldn't break the main functionality
    }
  }

  /**
   * Get comprehensive toothbrush information for UI display
   * Automatically handles migration for existing users
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

    // Ensure migration is completed before accessing data
    await this.ensureMigration(userId);

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

      // Emit event to notify other components of toothbrush update
      eventBus.emit('toothbrush-updated', {
        userId,
        action: oldBrush ? 'replaced' : 'created',
        newToothbrush: newBrush,
        oldToothbrush: oldBrush
      });
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
      return; // Silently skip for guests
    }

    try {
      const currentData = await ToothbrushRepository.getData(userId);
      
      // If user already has a toothbrush, don't create another
      if (currentData.current) {
        console.log('✅ User already has a toothbrush, skipping creation');
        return;
      }

      // Calculate start date
      const brushStartDate = startDate || new Date().toISOString();

      // Create default toothbrush
      const newBrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        startDate: brushStartDate,
        type: 'manual',
        purpose: 'regular',
        created_at: new Date().toISOString(),
      };

      const newData: ToothbrushData = {
        current: newBrush,
        history: currentData.history,
      };

      // Save to repository
      await ToothbrushRepository.saveData(userId, newData);
      
      console.log('✅ Successfully created first toothbrush');

      // Emit event to notify other components of toothbrush creation
      eventBus.emit('toothbrush-updated', {
        userId,
        action: 'created',
        newToothbrush: newBrush,
        oldToothbrush: null
      });
    } catch (error) {
      console.error('❌ Error creating first toothbrush:', error);
      throw error;
    }
  }

  /**
   * Get current toothbrush for a user
   * Automatically handles migration for existing users
   */
  static async getCurrentToothbrush(userId: string): Promise<Toothbrush | null> {
    console.log('🔍 Getting current toothbrush for user:', userId);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return null;
    }

    // Ensure migration is completed before accessing data
    await this.ensureMigration(userId);

    try {
      const toothbrushData = await ToothbrushRepository.getData(userId);
      return toothbrushData.current;
    } catch (error) {
      console.error('❌ Error getting current toothbrush:', error);
      return null;
    }
  }

  /**
   * Get all toothbrush data for a user
   * Automatically handles migration for existing users
   */
  static async getAllToothbrushData(userId: string): Promise<ToothbrushData> {
    console.log('📋 Getting all toothbrush data for user:', userId);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return { current: null, history: [] };
    }

    // Ensure migration is completed before accessing data
    await this.ensureMigration(userId);

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
    console.log('🗑️ Deleting toothbrush from history:', toothbrushId);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      throw new Error('Toothbrush tracking is not available for guest users');
    }

    try {
      const currentData = await ToothbrushRepository.getData(userId);
      
      // Remove from history
      const updatedHistory = currentData.history.filter(brush => brush.id !== toothbrushId);
      
      const newData: ToothbrushData = {
        current: currentData.current,
        history: updatedHistory,
      };

      await ToothbrushRepository.saveData(userId, newData);
      console.log('✅ Successfully deleted toothbrush from history');
    } catch (error) {
      console.error('❌ Error deleting toothbrush from history:', error);
      throw error;
    }
  }

  /**
   * Get simple days in use for current toothbrush
   */
  static async getSimpleDaysInUse(userId: string): Promise<number> {
    console.log('📅 Getting simple days in use for user:', userId);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      return 0;
    }

    try {
      const current = await this.getCurrentToothbrush(userId);
      if (!current) return 0;

      return ToothbrushCalculationService.calculateDaysInUse(current);
    } catch (error) {
      console.error('❌ Error getting simple days in use:', error);
      return 0;
    }
  }

  /**
   * Get brushing count for a specific toothbrush
   * Now uses the efficient counter-based system
   */
  static async getBrushingCount(userId: string, toothbrushId: string): Promise<number> {
    console.log('🔢 Getting brushing count for toothbrush:', toothbrushId);

    // Guest users don't have toothbrush tracking in backend
    if (userId === 'guest') {
      return 0;
    }

    try {
      return await ToothbrushDataService.getBrushingCountForUser(userId, toothbrushId);
    } catch (error) {
      console.error('❌ Error getting brushing count:', error);
      return 0;
    }
  }
} 