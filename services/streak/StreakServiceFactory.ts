import { StreakDataService } from './StreakDataService';
import { StreakEventService } from './StreakEventService';
import { StreakEventData } from './StreakTypes';

/**
 * Factory for creating and configuring the streak service ecosystem
 */
export class StreakServiceFactory {
  private static isInitialized = false;

  /**
   * Initialize the complete streak service ecosystem
   */
  static async initialize(config: StreakServiceConfig = {}): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const {
      enableCaching = true,
      enableEvents = true,
      enableDebugLogging = false
    } = config;

    try {
      // Initialize data service with caching
      if (enableCaching) {
        await StreakDataService.initialize();
      }

      // Configure debug logging if enabled
      if (enableDebugLogging && enableEvents) {
        this.setupDebugLogging();
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing StreakServiceFactory:', error);
      throw error;
    }
  }

  /**
   * Check if the service ecosystem is initialized
   */
  static isServiceInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the service ecosystem (useful for testing)
   */
  static async reset(): Promise<void> {
    try {
      // Clear all caches
      await StreakDataService.clearCache();
      
      // Clear all event listeners
      StreakEventService.clearAllListeners();
      
      this.isInitialized = false;
    } catch (error) {
      console.error('Error resetting StreakServiceFactory:', error);
    }
  }

  /**
   * Get current configuration status
   */
  static getStatus(): {
    initialized: boolean;
    hasEventListeners: boolean;
    cacheStatus: 'enabled' | 'disabled';
  } {
    return {
      initialized: this.isInitialized,
      hasEventListeners: StreakEventService.hasListeners('streak-updated') ||
                         StreakEventService.hasListeners('streak-calculated') ||
                         StreakEventService.hasListeners('history-updated'),
      cacheStatus: this.isInitialized ? 'enabled' : 'disabled'
    };
  }

  /**
   * Set up debug logging for all streak events
   */
  private static setupDebugLogging(): void {
    StreakEventService.on('streak-updated', (data: StreakEventData) => {
      console.log('[StreakService] Streak updated:', {
        userId: data.userId,
        previousStreak: data.previousStreak,
        newStreak: data.newStreak,
        timestamp: new Date(data.timestamp).toISOString()
      });
    });
    
    StreakEventService.on('streak-calculated', (data: StreakEventData) => {
      console.log('[StreakService] Streak calculated:', {
        userId: data.userId,
        newStreak: data.newStreak,
        timestamp: new Date(data.timestamp).toISOString()
      });
    });
    
    StreakEventService.on('history-updated', (data: StreakEventData) => {
      console.log('[StreakService] History updated:', {
        userId: data.userId,
        timestamp: new Date(data.timestamp).toISOString()
      });
    });
  }
}

/**
 * Configuration options for the streak service ecosystem
 */
export interface StreakServiceConfig {
  enableCaching?: boolean;
  enableEvents?: boolean;
  enableDebugLogging?: boolean;
}

/**
 * Convenience function to initialize with default settings
 */
export async function createStreakService(config?: StreakServiceConfig): Promise<void> {
  await StreakServiceFactory.initialize(config);
}

/**
 * Convenience function to create with debug logging enabled
 */
export async function createStreakServiceWithDebug(config: StreakServiceConfig = {}): Promise<void> {
  await StreakServiceFactory.initialize({
    ...config,
    enableDebugLogging: true
  });
} 