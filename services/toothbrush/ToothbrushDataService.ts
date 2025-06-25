import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { TOOTHBRUSH_CONFIG } from './ToothbrushConfig';
import { Toothbrush, ToothbrushData } from './ToothbrushTypes';
import { getLocalDateString } from '../../utils/dateUtils';
import { StreakSession } from '../streak/StreakTypes'; // Assuming StreakSession is defined elsewhere

/**
 * Service for all data access related to toothbrushes.
 * Handles interactions with AsyncStorage and Supabase.
 */
export class ToothbrushDataService {
  /**
   * Retrieves the current toothbrush and its history from local storage.
   */
  static async getToothbrushData(): Promise<ToothbrushData> {
    try {
      const stored = await AsyncStorage.getItem(TOOTHBRUSH_CONFIG.STORAGE_KEYS.TOOTHBRUSH_DATA);
      if (stored) {
        return JSON.parse(stored) as ToothbrushData;
      }
      // Return a default empty state if nothing is stored
      return { current: null, history: [] };
    } catch (error) {
      console.error('Error loading toothbrush data from AsyncStorage:', error);
      return { current: null, history: [] };
    }
  }

  /**
   * Saves the updated toothbrush data to local storage.
   * Optionally syncs the `current` toothbrush with the database.
   */
  static async updateToothbrushData(data: ToothbrushData, userId?: string): Promise<void> {
    try {
      await AsyncStorage.setItem(
        TOOTHBRUSH_CONFIG.STORAGE_KEYS.TOOTHBRUSH_DATA,
        JSON.stringify(data)
      );

      if (userId && data.current) {
        // Correctly sync with the 'users' table
        await this.syncStartDateWithUsersTable(data.current.startDate, userId);
      }
    } catch (error) {
      console.error('Error saving toothbrush data:', error);
    }
  }

  /**
   * Fetches brushing logs for a specific user within a date range.
   */
  static async getBrushingLogsForPeriod(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Pick<StreakSession, 'created_at' | 'date'>[]> {
    if (!userId) return [];

    try {
      const { data, error } = await supabase
        .from('brushing_logs')
        .select('created_at, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('Error fetching brushing logs for period:', error);
      return [];
    }
  }

  /**
   * Updates the `toothbrush_start_date` for a user in the `users` table.
   */
  private static async syncStartDateWithUsersTable(
    startDate: string,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ toothbrush_start_date: startDate })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing toothbrush start date with users table:', error);
    }
  }

  /**
   * Fetches the `toothbrush_start_date` for a user from the `users` table.
   */
  static async fetchStartDateFromUsersTable(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('toothbrush_start_date')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      return data?.toothbrush_start_date || null;
    } catch (error: any) {
      // Gracefully handle cases where the user or column might not exist yet
      if (error.code !== 'PGRST116') { // PGRST116 is "0 rows returned"
        console.error('Error fetching toothbrush start date from users table:', error);
      }
      return null;
    }
  }

  static async deleteBrushFromHistory(brushId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('toothbrushes')
        .delete()
        .eq('id', brushId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting brush from history:', error);
      // Decide if you want to re-throw or handle it silently
    }
  }
}
