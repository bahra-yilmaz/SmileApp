import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

// Single storage keys to avoid conflicts
const STORAGE_KEYS = {
  BRUSHING_TIME_GOAL: 'brushing_time_goal_v2',
  BRUSHING_FREQUENCY: 'brushing_frequency_v2',
  COMBINED_GOALS: 'brushing_goals_combined_v1',
} as const;

// Default values
export const DEFAULT_VALUES = {
  BRUSHING_TIME_MINUTES: 2, // 2 minutes
  BRUSHING_FREQUENCY: 2, // 2 times per day
} as const;

// Time target options (in minutes)
export interface BrushingTimeOption {
  id: string;
  minutes: number;
  seconds: number; // for database storage
  label: string;
  description: string;
  icon: string;
}

export const TIME_TARGET_OPTIONS: BrushingTimeOption[] = [
  {
    id: 'quick',
    minutes: 1.5,
    seconds: 90,
    label: 'settings.brushingTarget.options.quick_label', // Translation key
    description: 'settings.brushingTarget.options.quick_description',
    icon: 'flash-outline'
  },
  {
    id: 'standard',
    minutes: 2,
    seconds: 120,
    label: 'settings.brushingTarget.options.standard_label',
    description: 'settings.brushingTarget.options.standard_description',
    icon: 'checkmark-circle-outline'
  },
  {
    id: 'thorough',
    minutes: 3,
    seconds: 180,
    label: 'settings.brushingTarget.options.thorough_label',
    description: 'settings.brushingTarget.options.thorough_description',
    icon: 'star-outline'
  },
  {
    id: 'comprehensive',
    minutes: 4,
    seconds: 240,
    label: 'settings.brushingTarget.options.comprehensive_label',
    description: 'settings.brushingTarget.options.comprehensive_description',
    icon: 'diamond-outline'
  }
];

// Frequency options (times per day)
export interface BrushingFrequencyOption {
  id: string;
  count: number;
  label: string;
  description: string;
  icon: string;
}

export const FREQUENCY_OPTIONS: BrushingFrequencyOption[] = [
  {
    id: 'minimal',
    count: 1,
    label: 'settings.dailyFrequency.options.minimal_label', // Translation key
    description: 'settings.dailyFrequency.options.minimal_description',
    icon: 'sunny-outline'
  },
  {
    id: 'standard',
    count: 2,
    label: 'settings.dailyFrequency.options.standard_label',
    description: 'settings.dailyFrequency.options.standard_description',
    icon: 'checkmark-circle-outline'
  },
  {
    id: 'recommended',
    count: 3,
    label: 'settings.dailyFrequency.options.recommended_label',
    description: 'settings.dailyFrequency.options.recommended_description',
    icon: 'star-outline'
  },
  {
    id: 'comprehensive',
    count: 4,
    label: 'settings.dailyFrequency.options.comprehensive_label',
    description: 'settings.dailyFrequency.options.comprehensive_description',
    icon: 'diamond-outline'
  }
];

// Combined goals interface
export interface BrushingGoals {
  timeTargetMinutes: number;
  dailyFrequency: number;
  lastSyncTimestamp?: number;
  lastUpdatedBy?: 'user' | 'database' | 'onboarding';
}

// Events for listening to changes
export type BrushingGoalsEvent = 'time-target-changed' | 'frequency-changed' | 'goals-synced';

export class BrushingGoalsService {
  private static listeners: Map<BrushingGoalsEvent, Function[]> = new Map();
  private static currentGoals: BrushingGoals | null = null;

  /**
   * Initialize the service and load goals from storage
   */
  static async initialize(): Promise<BrushingGoals> {
    try {
      // Try to load combined goals first (new format)
      const combinedGoalsStr = await AsyncStorage.getItem(STORAGE_KEYS.COMBINED_GOALS);
      
      if (combinedGoalsStr) {
        const goals = JSON.parse(combinedGoalsStr) as BrushingGoals;
        this.currentGoals = goals;
        return goals;
      }

      // Fallback: migrate from old storage format
      const [timeGoalStr, frequencyStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BRUSHING_TIME_GOAL),
        AsyncStorage.getItem(STORAGE_KEYS.BRUSHING_FREQUENCY)
      ]);

      const timeTargetMinutes = timeGoalStr ? parseFloat(timeGoalStr) : DEFAULT_VALUES.BRUSHING_TIME_MINUTES;
      const dailyFrequency = frequencyStr ? parseInt(frequencyStr, 10) : DEFAULT_VALUES.BRUSHING_FREQUENCY;

      const goals: BrushingGoals = {
        timeTargetMinutes: isNaN(timeTargetMinutes) ? DEFAULT_VALUES.BRUSHING_TIME_MINUTES : timeTargetMinutes,
        dailyFrequency: isNaN(dailyFrequency) ? DEFAULT_VALUES.BRUSHING_FREQUENCY : dailyFrequency,
        lastUpdatedBy: 'user'
      };

      // Save in new format and clean up old keys
      await this.saveGoals(goals);
      await this.cleanupOldStorageKeys();

      this.currentGoals = goals;
      return goals;
    } catch (error) {
      console.error('Error initializing brushing goals:', error);
      const defaultGoals: BrushingGoals = {
        timeTargetMinutes: DEFAULT_VALUES.BRUSHING_TIME_MINUTES,
        dailyFrequency: DEFAULT_VALUES.BRUSHING_FREQUENCY,
        lastUpdatedBy: 'user'
      };
      this.currentGoals = defaultGoals;
      return defaultGoals;
    }
  }

  /**
   * Get current goals (from memory or storage)
   */
  static async getCurrentGoals(): Promise<BrushingGoals> {
    if (this.currentGoals) {
      return this.currentGoals;
    }
    return await this.initialize();
  }

  /**
   * Update time target (in minutes)
   */
  static async updateTimeTarget(
    minutes: number, 
    options: { 
      userId?: string; 
      syncToDatabase?: boolean; 
      source?: 'user' | 'database' | 'onboarding' 
    } = {}
  ): Promise<void> {
    const { userId, syncToDatabase = true, source = 'user' } = options;

    if (minutes <= 0) {
      throw new Error('Time target must be positive');
    }

    const currentGoals = await this.getCurrentGoals();
    const updatedGoals: BrushingGoals = {
      ...currentGoals,
      timeTargetMinutes: minutes,
      lastSyncTimestamp: Date.now(),
      lastUpdatedBy: source
    };

    // Save locally
    await this.saveGoals(updatedGoals);
    this.currentGoals = updatedGoals;

    // Sync to database if authenticated user and requested
    if (userId && syncToDatabase && source !== 'database') {
      try {
        const timeInSeconds = Math.round(minutes * 60);
        const { error } = await supabase
          .from('users')
          .update({ target_time_in_sec: timeInSeconds })
          .eq('id', userId);

        if (error) {
          console.error('Failed to sync time target to database:', error);
          throw error;
        }
      } catch (error) {
        console.error('Database sync failed for time target:', error);
        // Don't throw here - local update succeeded
      }
    }

    // Emit event
    this.emit('time-target-changed', { timeTargetMinutes: minutes, source });
  }

  /**
   * Update daily frequency
   */
  static async updateFrequency(
    frequency: number, 
    options: { 
      userId?: string; 
      syncToDatabase?: boolean; 
      source?: 'user' | 'database' | 'onboarding' 
    } = {}
  ): Promise<void> {
    const { userId, syncToDatabase = true, source = 'user' } = options;

    if (frequency <= 0) {
      throw new Error('Frequency must be positive');
    }

    const currentGoals = await this.getCurrentGoals();
    const updatedGoals: BrushingGoals = {
      ...currentGoals,
      dailyFrequency: frequency,
      lastSyncTimestamp: Date.now(),
      lastUpdatedBy: source
    };

    // Save locally
    await this.saveGoals(updatedGoals);
    this.currentGoals = updatedGoals;

    // Sync to database if authenticated user and requested
    if (userId && syncToDatabase && source !== 'database') {
      try {
        const { error } = await supabase
          .from('users')
          .update({ brushing_target: frequency })
          .eq('id', userId);

        if (error) {
          console.error('Failed to sync frequency to database:', error);
          throw error;
        }
      } catch (error) {
        console.error('Database sync failed for frequency:', error);
        // Don't throw here - local update succeeded
      }
    }

    // Emit event
    this.emit('frequency-changed', { dailyFrequency: frequency, source });
  }

  /**
   * Sync goals from database (for authenticated users)
   */
  static async syncFromDatabase(userId: string): Promise<BrushingGoals> {
    if (!userId) {
      throw new Error('User ID is required for database sync');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('target_time_in_sec, brushing_target')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching goals from database:', error);
        throw error;
      }

      const currentGoals = await this.getCurrentGoals();
      let hasChanges = false;
      const updatedGoals: BrushingGoals = { ...currentGoals };

      // Sync time target
      if (data?.target_time_in_sec) {
        const dbTimeMinutes = data.target_time_in_sec / 60;
        if (Math.abs(currentGoals.timeTargetMinutes - dbTimeMinutes) > 0.01) {
          updatedGoals.timeTargetMinutes = dbTimeMinutes;
          hasChanges = true;
        }
      } else {
        // Database has null, set to default
        const defaultSeconds = DEFAULT_VALUES.BRUSHING_TIME_MINUTES * 60;
        await supabase
          .from('users')
          .update({ target_time_in_sec: defaultSeconds })
          .eq('id', userId);
      }

      // Sync frequency
      if (data?.brushing_target) {
        if (currentGoals.dailyFrequency !== data.brushing_target) {
          updatedGoals.dailyFrequency = data.brushing_target;
          hasChanges = true;
        }
      } else {
        // Database has null, set to default
        await supabase
          .from('users')
          .update({ brushing_target: DEFAULT_VALUES.BRUSHING_FREQUENCY })
          .eq('id', userId);
      }

      if (hasChanges) {
        updatedGoals.lastSyncTimestamp = Date.now();
        updatedGoals.lastUpdatedBy = 'database';
        await this.saveGoals(updatedGoals);
        this.currentGoals = updatedGoals;
        this.emit('goals-synced', updatedGoals);
      }

      return updatedGoals;
    } catch (error) {
      console.error('Failed to sync goals from database:', error);
      throw error;
    }
  }

  /**
   * Get time target option by minutes
   */
  static getTimeTargetOption(minutes: number): BrushingTimeOption | null {
    return TIME_TARGET_OPTIONS.find(option => 
      Math.abs(option.minutes - minutes) < 0.01
    ) || null;
  }

  /**
   * Get frequency option by count
   */
  static getFrequencyOption(count: number): BrushingFrequencyOption | null {
    return FREQUENCY_OPTIONS.find(option => option.count === count) || null;
  }

  /**
   * Event subscription
   */
  static on(event: BrushingGoalsEvent, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit event
   */
  private static emit(event: BrushingGoalsEvent, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} callback:`, error);
        }
      });
    }
  }

  /**
   * Save goals to storage
   */
  private static async saveGoals(goals: BrushingGoals): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMBINED_GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Failed to save goals to storage:', error);
      throw error;
    }
  }

  /**
   * Clean up old storage keys from migration
   */
  private static async cleanupOldStorageKeys(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        'brushing_time_goal',
        'brushing_frequency', 
        'brushing_target',
        'daily_brushing_frequency'
      ]);
    } catch (error) {
      console.warn('Failed to cleanup old storage keys:', error);
    }
  }

  /**
   * Reset to defaults (for testing/onboarding reset)
   */
  static async resetToDefaults(userId?: string): Promise<BrushingGoals> {
    const defaultGoals: BrushingGoals = {
      timeTargetMinutes: DEFAULT_VALUES.BRUSHING_TIME_MINUTES,
      dailyFrequency: DEFAULT_VALUES.BRUSHING_FREQUENCY,
      lastUpdatedBy: 'user'
    };

    await this.saveGoals(defaultGoals);
    this.currentGoals = defaultGoals;

    // Reset in database if user provided
    if (userId) {
      try {
        await supabase
          .from('users')
          .update({
            target_time_in_sec: DEFAULT_VALUES.BRUSHING_TIME_MINUTES * 60,
            brushing_target: DEFAULT_VALUES.BRUSHING_FREQUENCY
          })
          .eq('id', userId);
      } catch (error) {
        console.error('Failed to reset goals in database:', error);
      }
    }

    this.emit('goals-synced', defaultGoals);
    return defaultGoals;
  }

  /**
   * Debug current state
   */
  static async debugCurrentState(): Promise<void> {
    const goals = await this.getCurrentGoals();
    console.log('🎯 Current Brushing Goals:', goals);
    console.log('📊 Time Target Option:', this.getTimeTargetOption(goals.timeTargetMinutes));
    console.log('📅 Frequency Option:', this.getFrequencyOption(goals.dailyFrequency));
  }
} 