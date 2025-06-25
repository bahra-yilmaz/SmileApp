import { v4 as uuidv4 } from 'uuid';
import { ToothbrushDataService } from './ToothbrushDataService';
import { ToothbrushCalculationService } from './ToothbrushCalculationService';
import { ToothbrushDisplayService } from './ToothbrushDisplayService';
import {
  Toothbrush,
  ToothbrushData,
  ToothbrushUsageStats,
  ToothbrushDisplayData,
} from './ToothbrushTypes';

/**
 * Main service facade for all toothbrush-related functionality.
 * Orchestrates the data, calculation, and display services.
 */
export class ToothbrushService {
  /**
   * Retrieves all necessary display and statistical data for the current toothbrush.
   * This is the primary method to be used by the UI.
   * @param userId - The ID of the current user.
   * @param t - The i18next translation function.
   * @returns An object containing both display-ready data and raw stats, or default data if no toothbrush.
   */
  static async getToothbrushInfo(
    userId: string,
    t: (key: string) => string
  ): Promise<{ displayData: ToothbrushDisplayData; stats: ToothbrushUsageStats } | null> {
    let toothbrushData: ToothbrushData;

    // For logged-in users, try smart sync first
    if (userId && userId !== 'guest') {
      try {
        toothbrushData = await ToothbrushDataService.smartSyncToothbrushData(userId);
      } catch (error) {
        console.error('Error with smart sync, falling back to local:', error);
        toothbrushData = await ToothbrushDataService.getToothbrushData();
      }
    } else {
      // For guest users, always use local storage
      toothbrushData = await ToothbrushDataService.getToothbrushData();
    }

    const currentBrush = toothbrushData.current;
    if (!currentBrush) {
      // Return default data for users with no toothbrush instead of null
      const defaultStats: ToothbrushUsageStats = {
        totalCalendarDays: 0,
        actualBrushingDays: 0,
        totalBrushingSessions: 0,
        averageBrushingsPerDay: 0,
        usagePercentage: 0,
        replacementStatus: 'brand_new',
      };

      const defaultDisplayData: ToothbrushDisplayData = {
        daysInUse: 0,
        healthPercentage: 100,
        healthStatusText: t('toothbrush.status.addToothbrush') || 'Add toothbrush',
        healthColor: '#9CA3AF', // neutral gray color
      };

      return { displayData: defaultDisplayData, stats: defaultStats };
    }

    // Calculate stats
    const stats = await ToothbrushCalculationService.calculateUsageStats(currentBrush, userId);

    // Generate display data
    const displayData = ToothbrushDisplayService.getDisplayData(stats, t);

    return { displayData, stats };
  }

  /**
   * Replaces the current toothbrush with a new one.
   * The old toothbrush is moved to history, and a new one is created with detailed properties.
   * @param userId - The ID of the current user.
   * @param details - An object containing the details of the new toothbrush.
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
    console.log('🔄 replaceToothbrush called for user:', userId, 'with details:', details);
    
    const toothbrushData = await ToothbrushDataService.getToothbrushData();
    const oldBrush = toothbrushData.current;

    console.log('📊 Current toothbrush data:', { 
      hasCurrentBrush: !!oldBrush, 
      historyCount: toothbrushData.history.length 
    });

    // Calculate start date based on age
    const startDate = details.ageDays && details.ageDays > 0
      ? new Date(Date.now() - (details.ageDays * 24 * 60 * 60 * 1000)).toISOString()
      : new Date().toISOString();

    const newBrush: Toothbrush = {
      id: uuidv4(),
      user_id: userId,
      startDate,
      type: details.type,
      purpose: details.purpose || 'regular',
      name: details.name,
      created_at: new Date().toISOString(),
    };

    console.log('🆕 Created new toothbrush:', { 
      id: newBrush.id, 
      name: newBrush.name, 
      type: newBrush.type, 
      startDate: newBrush.startDate 
    });

    // Move old brush to history with end date
    const newHistory = oldBrush 
      ? [...toothbrushData.history, { ...oldBrush, endDate: new Date().toISOString() }] 
      : toothbrushData.history;

    const newToothbrushData = {
      current: newBrush,
      history: newHistory,
    };

    console.log('💾 Saving toothbrush data...', { 
      isGuest: userId === 'guest',
      willSync: userId && userId !== 'guest' 
    });

    // Use the sync method for logged-in users
    if (userId && userId !== 'guest') {
      await ToothbrushDataService.updateToothbrushDataWithSync(newToothbrushData, userId);
    } else {
      await ToothbrushDataService.updateToothbrushData(newToothbrushData, userId);
    }

    console.log('✅ Toothbrush data saved successfully');
  }

  /**
   * A simple utility to get the number of days the current brush has been in use.
   */
  static async getSimpleDaysInUse(): Promise<number> {
    const toothbrushData = await ToothbrushDataService.getToothbrushData();
    if (!toothbrushData.current) {
      return 0;
    }
    const stats = await ToothbrushCalculationService.calculateUsageStats(
      toothbrushData.current,
      '' // No userId needed for simple day calculation
    );
    return stats.totalCalendarDays;
  }

  /**
   * Gets the current toothbrush object directly.
   * Useful for components that need access to the name, brand, type, etc.
   */
  static async getCurrentToothbrush(): Promise<Toothbrush | null> {
    const toothbrushData = await ToothbrushDataService.getToothbrushData();
    return toothbrushData.current;
  }

  /**
   * Creates the initial "First Brush" for new users.
   * This should be called when a user first signs up or completes onboarding.
   */
  static async createFirstBrushForNewUser(
    userId: string,
    t: (key: string) => string
  ): Promise<void> {
    // Skip for guest users
    if (!userId || userId === 'guest') {
      console.log('Skipping first brush creation for guest user');
      return;
    }

    try {
      // Check if user already has a toothbrush
      const existingData = await ToothbrushDataService.getToothbrushData();
      if (existingData.current) {
        console.log('User already has a toothbrush, skipping first brush creation');
        return;
      }

      // Create the first brush with translated name
      const firstBrush: Toothbrush = {
        id: uuidv4(),
        user_id: userId,
        startDate: new Date().toISOString(),
        type: 'manual', // Default to manual
        purpose: 'regular', // Default to regular
        name: t('settings.firstBrush'), // Translated "First Brush"
        created_at: new Date().toISOString(),
      };

      const newToothbrushData = {
        current: firstBrush,
        history: [],
      };

      // Save the data (will sync to backend automatically for authenticated users)
      await ToothbrushDataService.updateToothbrushDataWithSync(newToothbrushData, userId);

      console.log('✅ First brush created successfully for user:', userId);
    } catch (error) {
      console.error('❌ Error creating first brush for user:', error);
      // Don't throw - this shouldn't break the user flow
    }
  }
}

// Re-export all the new services and types for easy access
export * from './ToothbrushCalculationService';
export * from './ToothbrushDataService';
export * from './ToothbrushDisplayService';
export * from './ToothbrushConfig';
export * from './ToothbrushTypes'; 