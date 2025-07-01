import { StreakDataService } from './StreakDataService';
import { StreakCalculationService } from './StreakCalculationService';
import { StreakDisplayService } from './StreakDisplayService';
import { StreakEventService } from './StreakEventService';
import { 
  ComprehensiveStreakData,
  DailyGoalStatus,
  StreakSession,
  StreakEvent,
  StreakDataOptions,
  StreakStatus
} from './StreakTypes';

/**
 * Main StreakService that orchestrates all streak functionality
 * Provides a clean, unified API for the rest of the application
 * 
 * @example
 * ```typescript
 * import { StreakService } from './services/streak/StreakService';
 * import { createStreakService } from './services/streak';
 * 
 * // Initialize the service ecosystem
 * await createStreakService({ enableDebugLogging: true });
 * 
 * // Use the main service
 * const streakData = await StreakService.getStreakData(userId);
 * ```
 */
export class StreakService {

  /**
   * Initialize the streak service
   * @deprecated Use createStreakService() from StreakServiceFactory instead
   */
  static async initialize(): Promise<void> {
    await StreakDataService.initialize();
    StreakEventService.initialize(); // Initialize global event listeners
  }

  /**
   * Get current streak for a user
   */
  static async getCurrentStreak(
    userId: string, 
    options: { forceRefresh?: boolean; includeToday?: boolean } = {}
  ): Promise<number> {
    const { forceRefresh = false } = options;

    if (!forceRefresh) {
      const cachedData = StreakDataService.getCachedStreakData(userId);
      if (cachedData) {
        return cachedData.currentStreak;
      }
    }

    const streakData = await StreakCalculationService.calculateCurrentStreak(userId);
    await StreakDataService.cacheStreakData(streakData);
    
    StreakEventService.emitStreakCalculated(userId, streakData.currentStreak);
    
    return streakData.currentStreak;
  }

  /**
   * Get comprehensive streak data including all metrics
   */
  static async getStreakData(
    userId: string,
    options: StreakDataOptions = {}
  ): Promise<ComprehensiveStreakData> {
    return StreakCalculationService.getComprehensiveStreakData(userId, options.forceRefresh);
  }

  /**
   * Update streak after a new brushing session
   */
  static async updateStreakAfterBrushing(
    userId: string,
    newSession: StreakSession
  ): Promise<{
    previousStreak: number;
    newStreak: number;
    streakChanged: boolean;
  }> {
    const cachedData = StreakDataService.getCachedStreakData(userId);
    const previousStreak = cachedData?.currentStreak ?? 0;
    
    // Force refresh to include the new session
    const newStreak = await this.getCurrentStreak(userId, { forceRefresh: true });
    
    const streakChanged = newStreak !== previousStreak;
    
    if (streakChanged) {
      StreakEventService.emitStreakUpdate(userId, previousStreak, newStreak, newSession);
    }

    return {
      previousStreak,
      newStreak,
      streakChanged
    };
  }

  /**
   * Check daily goal status for today
   */
  static async checkDailyGoalStatus(userId: string): Promise<DailyGoalStatus> {
    return StreakCalculationService.checkDailyGoalStatus(userId);
  }

  /**
   * Get enhanced streak status with current day progress
   */
  static async getStreakStatus(userId: string): Promise<StreakStatus> {
    return StreakCalculationService.getStreakStatus(userId);
  }

  /**
   * Get display information for streak UI
   */
  static getStreakDisplayInfo(
    streakDays: number, 
    totalBrushings: number,
    t: (key: string, options?: any) => string
  ) {
    return StreakDisplayService.getStreakDisplayInfo(streakDays, totalBrushings, t);
  }

  /**
   * Get responsive title for keep going section
   */
  static getKeepGoingTitle(streakDays: number): string {
    return StreakDisplayService.getKeepGoingDefaultTitle(streakDays);
  }

  /**
   * Get appropriate icon for current streak phase
   */
  static getStreakIcon(streakDays: number): string {
    return StreakDisplayService.getStreakIcon(streakDays);
  }

  /**
   * Get color theme for current streak phase
   */
  static getStreakColorTheme(streakDays: number) {
    return StreakDisplayService.getStreakColorTheme(streakDays);
  }

  /**
   * Check if streak milestone deserves celebration
   */
  static shouldCelebrate(previousStreak: number, currentStreak: number): boolean {
    return StreakDisplayService.shouldCelebrate(previousStreak, currentStreak);
  }

  /**
   * Get celebration message for milestone
   */
  static getCelebrationMessage(
    streakDays: number, 
    t: (key: string, options?: any) => string
  ): string {
    return StreakDisplayService.getCelebrationMessage(streakDays, t);
  }

  /**
   * Calculate milestone progress
   */
  static calculateMilestoneProgress(currentStreak: number) {
    return StreakCalculationService.calculateMilestoneProgress(currentStreak);
  }

  /**
   * Clear all cached data
   */
  static async clearCache(): Promise<void> {
    await StreakDataService.clearCache();
    StreakEventService.emit('streak-updated', { cleared: true });
  }

  /**
   * Subscribe to streak events
   */
  static on(event: StreakEvent, callback: Function): () => void {
    return StreakEventService.on(event, callback);
  }

  /**
   * Debug current state (for development)
   */
  static async debugCurrentState(): Promise<void> {
    console.log('=== StreakService Debug ===');
    console.log('Event listeners:', {
      'streak-updated': StreakEventService.getListenerCount('streak-updated'),
      'streak-calculated': StreakEventService.getListenerCount('streak-calculated'),
      'history-updated': StreakEventService.getListenerCount('history-updated'),
    });
    console.log('=== End Debug ===');
  }
} 