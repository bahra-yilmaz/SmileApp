import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabaseClient';
import { TOOTHBRUSH_CONFIG } from './ToothbrushConfig';
import { Toothbrush, ToothbrushData, ToothbrushUsageStats } from './ToothbrushTypes';
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

      // Only sync with the 'users' table for authenticated users, not guests
      if (userId && userId !== 'guest' && data.current) {
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
    try {
      // Only authenticated users have toothbrush tracking
      if (!userId || userId === 'guest') {
        return [];
      }

      const { data, error } = await supabase
        .from('brushing_logs')
        .select('created_at, date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching brushing logs for period:', error);
      return [];
    }
  }

  /**
   * Updates the `toothbrush_start_date` for a user in the `users` table.
   */
  static async syncStartDateWithUsersTable(startDate: string, userId: string): Promise<void> {
    try {
      console.log('🔄 Syncing start_date with users table:', { userId, startDate });
      
      const { error } = await supabase
        .from('users')
        .update({ 
          toothbrush_start_date: startDate
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Error syncing start_date with users table:', error);
        throw error;
      }

      console.log('✅ Start date synced with users table successfully');
    } catch (error) {
      console.error('❌ Failed to sync start_date with users table:', error);
      throw error;
    }
  }

  /**
   * Fetches the `toothbrush_start_date` for a user from the `users` table.
   */
  static async fetchStartDateFromUsersTable(userId: string): Promise<string | null> {
    try {
      console.log('📡 Fetching start_date from users table for user:', userId);

      const { data, error } = await supabase
        .from('users')
        .select('toothbrush_start_date')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching start_date from users table:', error);
        return null;
      }

      if (data?.toothbrush_start_date) {
        console.log('✅ Fetched start_date from users table:', data.toothbrush_start_date);
        return data.toothbrush_start_date;
      }

      console.log('📝 No start_date found in users table');
      return null;
    } catch (error) {
      console.error('❌ Failed to fetch start_date from users table:', error);
      return null;
    }
  }

  /**
   * Saves toothbrush usage stats to local cache.
   * @param stats The stats data to cache.
   */
  static async saveStatsToCache(stats: ToothbrushUsageStats): Promise<void> {
    try {
      await AsyncStorage.setItem(
        TOOTHBRUSH_CONFIG.STORAGE_KEYS.TOOTHBRUSH_STATS_CACHE,
        JSON.stringify(stats)
      );
    } catch (error) {
      console.warn('⚠️ Could not save toothbrush stats to cache:', error);
    }
  }

  /**
   * Retrieves toothbrush usage stats from local cache.
   * @returns The cached stats, or null if not found or expired.
   */
  static async getStatsFromCache(): Promise<ToothbrushUsageStats | null> {
    try {
      const cachedStats = await AsyncStorage.getItem(
        TOOTHBRUSH_CONFIG.STORAGE_KEYS.TOOTHBRUSH_STATS_CACHE
      );
      if (!cachedStats) return null;

      const stats = JSON.parse(cachedStats) as ToothbrushUsageStats;
      
      // Optional: Add cache invalidation logic here if needed (e.g., based on a timestamp)
      
      return stats;
    } catch (error) {
      console.warn('⚠️ Could not retrieve toothbrush stats from cache:', error);
      return null;
    }
  }

  /**
   * Clears the toothbrush stats cache
   * Should be called when toothbrushes are created, replaced, or updated
   */
  static async clearStatsCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TOOTHBRUSH_CONFIG.STORAGE_KEYS.TOOTHBRUSH_STATS_CACHE);
      console.log('🗑️ Toothbrush stats cache cleared');
    } catch (error) {
      console.warn('⚠️ Could not clear toothbrush stats cache:', error);
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

  /**
   * Gets brushing logs for a specific toothbrush period.
   * This helps track which brushing sessions belong to which toothbrush.
   */
  static async getBrushingLogsForToothbrush(
    userId: string,
    toothbrush: Toothbrush
  ): Promise<Pick<StreakSession, 'created_at' | 'date'>[]> {
    const startDate = toothbrush.startDate.slice(0, 10); // Extract YYYY-MM-DD
    const endDate = toothbrush.endDate 
      ? toothbrush.endDate.slice(0, 10) 
      : getLocalDateString(); // Use today if no end date

    return this.getBrushingLogsForPeriod(userId, startDate, endDate);
  }

  /**
   * Get brushing count for a specific toothbrush
   * Now uses the fast brushing_count column
   */
  static async getBrushingCount(toothbrush: Toothbrush): Promise<number> {
    console.log('📊 Getting brushing count for toothbrush:', toothbrush.id);

    try {
      // Simply read the counter from the toothbrush record (fast!)
      const { data, error } = await supabase
        .from('toothbrushes')
        .select('brushing_count')
        .eq('id', toothbrush.id)
        .single();

      if (error) {
        console.error('❌ Error fetching brushing count:', error);
        return 0;
      }

      const count = data?.brushing_count || 0;
      console.log('✅ Brushing count:', count);
      return count;
    } catch (error) {
      console.error('❌ Error in getBrushingCount:', error);
      return 0;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   * Now redirects to the fast counter-based method
   */
  static async getBrushingCountForUser(userId: string, toothbrushId: string): Promise<number> {
    console.log('📊 Getting brushing count (legacy method) for toothbrush:', toothbrushId);

    try {
      // Get the toothbrush first, then use the counter
      const { data, error } = await supabase
        .from('toothbrushes')
        .select('brushing_count')
        .eq('id', toothbrushId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('❌ Error fetching brushing count:', error);
        return 0;
      }

      return data?.brushing_count || 0;
    } catch (error) {
      console.error('❌ Error in getBrushingCountForUser:', error);
      return 0;
    }
  }

  /**
   * Gets the current toothbrush ID for a user (for linking new brushing sessions)
   */
  static async getCurrentToothbrushId(userId: string): Promise<string | null> {
    try {
      console.log('🔍 Looking for current toothbrush for user:', userId);
      
      const { data, error } = await supabase
        .from('toothbrushes')
        .select('id, name, is_current')
        .eq('user_id', userId)
        .eq('is_current', true)
        .single();

      if (error) {
        console.log('❌ Error or no current toothbrush found:', error.code, error.message);
        return null;
      }

      if (!data) {
        console.log('❌ No current toothbrush data returned');
        return null;
      }

      console.log('✅ Found current toothbrush:', { id: data.id, name: data.name, is_current: data.is_current });
      return data.id;
    } catch (error) {
      console.error('❌ Exception getting current toothbrush ID:', error);
      return null;
    }
  }

  /**
   * Links a brushing session to the current toothbrush
   */
  static async linkBrushingToCurrentToothbrush(userId: string, brushingLogId: string): Promise<void> {
    try {
      console.log('🔗 Linking brushing session to current toothbrush:', { userId, brushingLogId });

      // Get current toothbrush
      const toothbrushData = await this.getToothbrushData();
      const currentToothbrush = toothbrushData.current;

      if (!currentToothbrush) {
        console.warn('⚠️ No current toothbrush found, cannot link brushing session');
        return;
      }

      console.log('🦷 Found current toothbrush:', currentToothbrush.id);

      // Update the brushing log with toothbrush_id
      const { error } = await supabase
        .from('brushing_logs')
        .update({ 
          toothbrush_id: currentToothbrush.id
        })
        .eq('id', brushingLogId)
        .eq('user_id', userId); // Additional security check

      if (error) {
        console.error('❌ Error linking brushing to toothbrush:', error);
        throw error;
      }

      console.log('✅ Successfully linked brushing session to toothbrush:', currentToothbrush.id);
    } catch (error) {
      console.error('❌ Failed to link brushing to current toothbrush:', error);
      // Don't throw the error - this is not critical for the brushing session
      // Just log it and continue
    }
  }

  /**
   * Gets brushing logs directly linked to a specific toothbrush (more accurate than date-based)
   */
  static async getBrushingLogsByToothbrushId(
    userId: string,
    toothbrushId: string
  ): Promise<Pick<StreakSession, 'created_at' | 'date'>[]> {
    try {
      const { data, error } = await supabase
        .from('brushing_logs')
        .select('created_at, date')
        .eq('user_id', userId)
        .eq('toothbrush_id', toothbrushId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching brushing logs by toothbrush ID:', error);
      return [];
    }
  }

  /**
   * Update toothbrush data in backend
   */
  static async updateToothbrushDataInBackend(userId: string, data: ToothbrushData): Promise<void> {
    try {
      console.log('🔄 Updating toothbrush data in backend for user:', userId, data);

      // CRITICAL: First clear any existing current toothbrushes to avoid unique constraint violation
      console.log('🔄 Clearing existing current toothbrushes for user:', userId);
      const { error: clearError } = await supabase
        .from('toothbrushes')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('is_current', true);

      if (clearError) {
        console.error('❌ Error clearing existing current toothbrushes:', clearError);
        throw clearError;
      }

      // Now, handle the current toothbrush (safe to set is_current = true)
      if (data.current) {
        const { error: upsertError } = await supabase
          .from('toothbrushes')
          .upsert({
            id: data.current.id,
            user_id: userId,
            type: data.current.type,
            purpose: data.current.purpose,
            name: data.current.name || null,
            start_date: data.current.startDate,
            end_date: data.current.endDate || null,
            is_current: true,
            created_at: data.current.created_at || new Date().toISOString(),
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('❌ Error upserting current toothbrush:', upsertError);
          throw upsertError;
        }

        console.log('✅ Current toothbrush updated successfully');
      }

      // Then handle history (mark old ones as not current)
      if (data.history.length > 0) {
        for (const brush of data.history) {
          const { error: historyError } = await supabase
            .from('toothbrushes')
            .upsert({
              id: brush.id,
              user_id: userId,
              type: brush.type,
              purpose: brush.purpose,
              name: brush.name || null,
              start_date: brush.startDate,
              end_date: brush.endDate || null,
              is_current: false,
              created_at: brush.created_at || new Date().toISOString(),
            }, {
              onConflict: 'id'
            });

          if (historyError) {
            console.error('❌ Error upserting history toothbrush:', historyError);
            // Don't throw here, continue with other history items
          }
        }

        console.log('✅ History toothbrushes updated successfully');
      }

      console.log('✅ All toothbrush data updated in backend');
    } catch (error) {
      console.error('❌ Failed to update toothbrush data in backend:', error);
      throw error;
    }
  }

  /**
   * Syncs current toothbrush data to the backend
   */
  static async syncToothbrushToBackend(toothbrush: Toothbrush): Promise<void> {
    try {
      console.log('📤 Syncing toothbrush to backend:', {
        id: toothbrush.id,
        name: toothbrush.name,
        user_id: toothbrush.user_id,
        is_current: !toothbrush.endDate
      });

      const willBeCurrent = !toothbrush.endDate;

      // If this toothbrush will be current, clear existing current toothbrushes first
      if (willBeCurrent) {
        console.log('🔄 Clearing existing current toothbrushes before syncing:', toothbrush.user_id);
        const { error: clearError } = await supabase
          .from('toothbrushes')
          .update({ is_current: false })
          .eq('user_id', toothbrush.user_id)
          .eq('is_current', true)
          .neq('id', toothbrush.id); // Don't clear this toothbrush itself

        if (clearError) {
          console.error('❌ Error clearing existing current toothbrushes:', clearError);
          // Don't throw - continue with the sync
        }
      }

      const { data, error } = await supabase
        .from('toothbrushes')
        .upsert({
          id: toothbrush.id,
          user_id: toothbrush.user_id,
          name: toothbrush.name,
          start_date: toothbrush.startDate,
          end_date: toothbrush.endDate,
          type: toothbrush.type,
          purpose: toothbrush.purpose,
          is_current: willBeCurrent, // Current if no end date
          created_at: toothbrush.created_at
        })
        .select();

      if (error) {
        console.error('❌ Error syncing toothbrush to backend:', error);
        throw error;
      }

      console.log('✅ Successfully synced toothbrush to backend:', data);
    } catch (error) {
      console.error('❌ Exception syncing toothbrush to backend:', error);
      // Don't throw - let the operation succeed locally
    }
  }

  /**
   * Loads toothbrush data from the backend for authenticated users
   */
  static async pullToothbrushFromBackend(userId: string): Promise<ToothbrushData | null> {
    try {
      // Get current toothbrush (is_current = true)
      const { data: currentData, error: currentError } = await supabase
        .from('toothbrushes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle();

      if (currentError) throw currentError;

      // Get historical toothbrushes (is_current = false)
      const { data: historyData, error: historyError } = await supabase
        .from('toothbrushes')
        .select('*')
        .eq('user_id', userId)
        .eq('is_current', false)
        .order('end_date', { ascending: false });

      if (historyError) throw historyError;

      const current = currentData;
      const history = historyData || [];

      const toothbrushData: ToothbrushData = {
        current: current ? {
          id: current.id,
          user_id: current.user_id,
          name: current.name,
          startDate: current.start_date,
          endDate: current.end_date,
          type: current.type,
          purpose: current.purpose,
          created_at: current.created_at
        } : null,
        history: history.map(t => ({
          id: t.id,
          user_id: t.user_id,
          name: t.name,
          startDate: t.start_date,
          endDate: t.end_date,
          type: t.type,
          purpose: t.purpose,
          created_at: t.created_at
        }))
      };

      return toothbrushData;
    } catch (error) {
      console.error('Error pulling toothbrush data from backend:', error);
      return null;
    }
  }

  /**
   * Updates toothbrush data locally and syncs to backend for all users
   */
  static async updateToothbrushDataWithSync(data: ToothbrushData, userId: string): Promise<void> {
    // Always update local storage first
    await this.updateToothbrushData(data, userId);

    // Sync to backend for all users (including guests)
    try {
      // Sync current toothbrush
      if (data.current) {
        await this.syncToothbrushToBackend({ ...data.current, user_id: userId });
      }

      // Sync history items
      for (const item of data.history) {
        await this.syncToothbrushToBackend({ ...item, user_id: userId });
      }
    } catch (error) {
      console.error('Error syncing to backend:', error);
      // Don't throw - local update succeeded
    }
  }

  /**
   * Smart sync method that loads from backend if available, falls back to local storage
   */
  static async smartSyncToothbrushData(userId: string): Promise<ToothbrushData> {
    try {
      // Try to load from backend first
      const backendData = await this.pullToothbrushFromBackend(userId);
      
      if (backendData) {
        // Save to local storage for offline access
        await this.updateToothbrushData(backendData, userId);
        return backendData;
      }

      // Fall back to local storage
      const localData = await this.getToothbrushData();
      
      // If we have local data but no backend data, sync to backend
      if (localData.current) {
        await this.syncToothbrushToBackend({ ...localData.current, user_id: userId });
        for (const historyItem of localData.history) {
          await this.syncToothbrushToBackend({ ...historyItem, user_id: userId });
        }
      }

      return localData;
    } catch (error) {
      console.error('Error in smart sync:', error);
      // Fall back to local storage on any error
      return await this.getToothbrushData();
    }
  }

  private static getLatestToothbrush(local: Toothbrush | null, remote: Toothbrush | null): Toothbrush | null {
    if (!local) return remote;
    if (!remote) return local;
    
    // Use the one with latest created_at
    return new Date(local.created_at) > new Date(remote.created_at) ? local : remote;
  }

  private static mergeToothbrushHistory(local: Toothbrush[], remote: Toothbrush[]): Toothbrush[] {
    const merged = new Map<string, Toothbrush>();
    
    // Add all local items
    local.forEach(brush => merged.set(brush.id, brush));
    
    // Add remote items (newer ones will overwrite)
    remote.forEach(brush => {
      const existing = merged.get(brush.id);
      if (!existing || new Date(brush.created_at) > new Date(existing.created_at)) {
        merged.set(brush.id, brush);
      }
    });
    
    return Array.from(merged.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
}
