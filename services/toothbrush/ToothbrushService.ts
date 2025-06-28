import { v4 as uuidv4 } from 'uuid';
import { Toothbrush, ToothbrushData, ToothbrushUsageStats, ToothbrushDisplayData } from './ToothbrushTypes';
import { ToothbrushRepository } from './ToothbrushRepository';
import { ToothbrushCalculationService } from './ToothbrushCalculationService';
import { ToothbrushDisplayService } from './ToothbrushDisplayService';
import { eventBus } from '../../utils/EventBus';
import { ToothbrushDataService } from './ToothbrushDataService';
import { ToothbrushMigrationService } from './ToothbrushMigrationService';
import { supabase } from '../supabaseClient';
import { ApproximateBrushingCalculator } from './ApproximateBrushingCalculator';

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
   * Optimized to avoid repeated migration checks
   */
  private static async ensureMigration(userId: string): Promise<void> {
    if (userId === 'guest') return;
    
    // Fast check - if migration is already completed, skip entirely (PERFORMANCE FIX)
    const isCompleted = await ToothbrushMigrationService.isMigrationCompleted(userId);
    if (isCompleted) {
      return; // Skip migration entirely
    }
    
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
   * Now includes smart brushing count estimation for aged toothbrushes
   */
  static async replaceToothbrush(
    userId: string,
    t: (key: string) => string,
    config: {
      type: 'manual' | 'electric';
      purpose: 'regular' | 'braces' | 'sensitive' | 'whitening';
      name?: string;
      ageDays?: number;
    }
  ): Promise<void> {
    console.log('🔄 Replacing toothbrush for user:', userId, config);

    // Guest users don't have toothbrush tracking
    if (userId === 'guest') {
      throw new Error('Toothbrush tracking is not available for guest users');
    }

    try {
      const currentData = await ToothbrushRepository.getData(userId);
      const now = new Date();
      const startDate = config.ageDays 
        ? new Date(now.getTime() - (config.ageDays * 24 * 60 * 60 * 1000))
        : now;

      // Create new toothbrush with type-based default name if no name provided
      const defaultName = config.name || 
        (config.type === 'electric' 
          ? t('toothbrush.defaultNames.electricToothbrush')
          : t('toothbrush.defaultNames.manualToothbrush'));
      
      const newToothbrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        name: defaultName,
        startDate: startDate.toISOString(),
        type: config.type,
        purpose: config.purpose,
        created_at: now.toISOString(),
      };

      // Calculate approximate brushing count for aged toothbrushes
      let initialBrushingCount = 0;
      if (config.ageDays && config.ageDays > 0) {
        const estimation = await ApproximateBrushingCalculator.calculateApproximateBrushings({
          ageDays: config.ageDays,
          userId,
          toothbrushPurpose: config.purpose,
          toothbrushType: config.type
        });

        // Validate the estimation
        const validation = ApproximateBrushingCalculator.validateEstimation(
          estimation.estimatedBrushings, 
          config.ageDays
        );

        if (validation.isReasonable) {
          initialBrushingCount = estimation.estimatedBrushings;
          console.log('✅ Applied smart brushing estimation:', {
            ageDays: config.ageDays,
            estimatedBrushings: initialBrushingCount,
            explanation: ApproximateBrushingCalculator.generateEstimationExplanation(estimation, config.ageDays)
          });
        } else {
          console.warn('⚠️ Estimation validation failed:', validation.warning);
          // Fall back to a simple calculation: age_days * 1.5 (reasonable average)
          initialBrushingCount = Math.round(config.ageDays * 1.5);
          console.log('🔄 Using fallback calculation:', initialBrushingCount);
        }
      }

      // Move current toothbrush to history if it exists
      const newHistory = currentData.current 
        ? [...currentData.history, { ...currentData.current, endDate: now.toISOString() }]
        : currentData.history;

      const newData: ToothbrushData = {
        current: newToothbrush,
        history: newHistory,
      };

      // Save to repository
      await ToothbrushRepository.saveData(userId, newData);

      // If we have an initial brushing count, update it in the backend
      if (initialBrushingCount > 0) {
        await this.updateToothbrushBrushingCount(newToothbrush.id, initialBrushingCount);
      }

      // Clear stats cache since we have a new toothbrush
      await ToothbrushDataService.clearStatsCache();

      console.log('✅ Successfully replaced toothbrush');

      // Emit event for other components to refresh
      eventBus.emit('toothbrush-updated', {
        action: 'replaced',
        userId,
        oldToothbrush: currentData.current,
        newToothbrush,
      });

    } catch (error) {
      console.error('❌ Error replacing toothbrush:', error);
      throw error;
    }
  }

  /**
   * Helper method to update brushing count for a toothbrush
   */
  private static async updateToothbrushBrushingCount(toothbrushId: string, count: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('toothbrushes')
        .update({ brushing_count: count })
        .eq('id', toothbrushId);

      if (error) {
        console.error('❌ Error updating toothbrush brushing count:', error);
        throw error;
      }

      console.log('✅ Updated toothbrush brushing count:', { toothbrushId, count });
    } catch (error) {
      console.error('❌ Failed to update brushing count:', error);
      throw error;
    }
  }

  /**
   * Create the first toothbrush for new users
   * Now supports configuration options and automatic brushing count estimation
   */
  static async createFirstBrush(
    userId: string,
    t: (key: string) => string,
    startDate?: string | null,
    config?: {
      type?: 'manual' | 'electric';
      purpose?: 'regular' | 'braces' | 'sensitive' | 'whitening';
      name?: string;
      ageDays?: number; // For aged toothbrushes during onboarding
    }
  ): Promise<void> {
    console.log('🆕 Creating first brush for user:', userId, 'with config:', { startDate, config });

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

      // Calculate start date - use provided startDate or derive from ageDays
      let brushStartDate: string;
      let calculatedAgeDays = 0;

      if (config?.ageDays && config.ageDays > 0) {
        // If ageDays is provided, calculate the start date from that
        const now = new Date();
        brushStartDate = new Date(now.getTime() - (config.ageDays * 24 * 60 * 60 * 1000)).toISOString();
        calculatedAgeDays = config.ageDays;
        console.log('📅 Using ageDays to calculate start date:', { ageDays: config.ageDays, startDate: brushStartDate });
      } else if (startDate) {
        // Use the provided start date and calculate age from it
        brushStartDate = startDate;
        const now = new Date();
        const start = new Date(startDate);
        calculatedAgeDays = Math.max(0, Math.floor((now.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
        console.log('📅 Using provided start date:', { startDate, calculatedAgeDays });
      } else {
        // Default to current date (brand new toothbrush)
        brushStartDate = new Date().toISOString();
        calculatedAgeDays = 0;
      }

      // Create toothbrush with configuration or defaults
      // Use "First Brush" as default name for onboarding
      const defaultName = config?.name || t('toothbrush.defaultNames.firstBrush');
      
      const newBrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        name: defaultName,
        startDate: brushStartDate,
        type: config?.type || 'manual',
        purpose: config?.purpose || 'regular',
        created_at: new Date().toISOString(),
      };

      // Calculate approximate brushing count for aged toothbrushes
      let initialBrushingCount = 0;
      if (calculatedAgeDays > 0) {
        console.log('🧮 Calculating initial brushing count for aged toothbrush:', calculatedAgeDays, 'days');
        
        const estimation = await ApproximateBrushingCalculator.calculateApproximateBrushings({
          ageDays: calculatedAgeDays,
          userId,
          toothbrushPurpose: newBrush.purpose,
          toothbrushType: newBrush.type
        });

        // Validate the estimation
        const validation = ApproximateBrushingCalculator.validateEstimation(
          estimation.estimatedBrushings, 
          calculatedAgeDays
        );

        if (validation.isReasonable) {
          initialBrushingCount = estimation.estimatedBrushings;
          console.log('✅ Applied smart brushing estimation:', {
            ageDays: calculatedAgeDays,
            estimatedBrushings: initialBrushingCount,
            explanation: ApproximateBrushingCalculator.generateEstimationExplanation(estimation, calculatedAgeDays)
          });
        } else {
          console.warn('⚠️ Estimation validation failed:', validation.warning);
          // Fall back to a simple calculation: age_days * 1.5 (reasonable average)
          initialBrushingCount = Math.round(calculatedAgeDays * 1.5);
          console.log('🔄 Using fallback calculation:', initialBrushingCount);
        }
      }

      const newData: ToothbrushData = {
        current: newBrush,
        history: currentData.history,
      };

      // Save to repository
      await ToothbrushRepository.saveData(userId, newData);

      // If we have an initial brushing count, update it in the backend
      if (initialBrushingCount > 0) {
        await this.updateToothbrushBrushingCount(newBrush.id, initialBrushingCount);
      }

      // Clear stats cache to ensure fresh data for the new toothbrush
      await ToothbrushDataService.clearStatsCache();
      
      console.log('✅ Successfully created first toothbrush with smart estimation');

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
      // First, delete from the database
      await ToothbrushRepository.deleteFromHistory(toothbrushId);
      
      // Then update local data to reflect the deletion
      const currentData = await ToothbrushRepository.getData(userId);
      
      // Remove from history array
      const updatedHistory = currentData.history.filter(brush => brush.id !== toothbrushId);
      
      const newData: ToothbrushData = {
        current: currentData.current,
        history: updatedHistory,
      };

      // Cache the updated data locally (don't save to backend since we already deleted)
      await ToothbrushRepository.cacheData(newData);

      // Clear stats cache since history has changed
      await ToothbrushDataService.clearStatsCache();

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
   * Get brushing count for a specific toothbrush by ID (used in settings)
   * Now uses the fast counter-based method directly
   */
  static async getBrushingCount(userId: string, toothbrushId: string): Promise<number> {
    console.log('🔢 Getting brushing count for toothbrush:', toothbrushId);

    try {
      // Use the fast counter method directly
      const { data, error } = await supabase
        .from('toothbrushes')
        .select('brushing_count')
        .eq('id', toothbrushId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching toothbrush counter:', error);
        return 0;
      }

      return data?.brushing_count || 0;
    } catch (error) {
      console.error('❌ Error in getBrushingCount:', error);
      return 0;
    }
  }
} 