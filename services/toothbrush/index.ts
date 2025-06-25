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
   * @returns An object containing both display-ready data and raw stats, or null.
   */
  static async getToothbrushInfo(
    userId: string,
    t: (key: string) => string
  ): Promise<{ displayData: ToothbrushDisplayData; stats: ToothbrushUsageStats } | null> {
    let toothbrushData = await ToothbrushDataService.getToothbrushData();
    let currentBrush = toothbrushData.current;

    // If no local toothbrush, try to initialize from the database for logged-in users.
    if (!currentBrush && userId && userId !== 'guest') {
      const startDateFromDB = await ToothbrushDataService.fetchStartDateFromUsersTable(userId);
      
      if (startDateFromDB) {
        // Create a new toothbrush object from the database start date
        currentBrush = {
          id: uuidv4(), // A new local ID is fine
          startDate: startDateFromDB,
          type: 'manual', // Default type, can be updated later
        };
        // Save this new data locally
        toothbrushData = { ...toothbrushData, current: currentBrush };
        await ToothbrushDataService.updateToothbrushData(toothbrushData, userId);
      }
    } else if (userId === 'guest' && !currentBrush) {
      // For GUEST users, if they don't have a brush, create a brand new one.
      currentBrush = {
        id: uuidv4(),
        startDate: new Date().toISOString(),
        type: 'manual',
      };
      toothbrushData = { ...toothbrushData, current: currentBrush };
      await ToothbrushDataService.updateToothbrushData(toothbrushData, userId);
    }

    if (!currentBrush) {
      return null; // Still no toothbrush, so can't proceed
    }

    const stats = await ToothbrushCalculationService.calculateUsageStats(currentBrush, userId);
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
      brand?: string;
      model?: string;
    }
  ): Promise<void> {
    const toothbrushData = await ToothbrushDataService.getToothbrushData();
    const oldBrush = toothbrushData.current;

    const newBrush: Toothbrush = {
      id: uuidv4(),
      startDate: new Date().toISOString(),
      type: details.type,
      purpose: details.purpose || 'regular',
      brand: details.brand,
      model: details.model,
    };

    const newHistory = oldBrush ? [...toothbrushData.history, oldBrush] : toothbrushData.history;

    const newToothbrushData = {
      current: newBrush,
      history: newHistory,
    };

    await ToothbrushDataService.updateToothbrushData(newToothbrushData, userId);
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
}

// Re-export all the new services and types for easy access
export * from './ToothbrushCalculationService';
export * from './ToothbrushDataService';
export * from './ToothbrushDisplayService';
export * from './ToothbrushConfig';
export * from './ToothbrushTypes'; 