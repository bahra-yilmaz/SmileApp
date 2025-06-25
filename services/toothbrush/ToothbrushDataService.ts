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
    if (!userId || userId === 'guest') return [];

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
    // Skip for guest users
    if (!userId || userId === 'guest') {
      console.log('Skipping users table sync for guest user');
      return;
    }

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
    // Skip for guest users
    if (!userId || userId === 'guest') {
      console.log('Skipping users table fetch for guest user');
      return null;
    }

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

  /**
   * Gets brushing logs for a specific toothbrush period.
   * This helps track which brushing sessions belong to which toothbrush.
   */
  static async getBrushingLogsForToothbrush(
    userId: string,
    toothbrush: Toothbrush
  ): Promise<Pick<StreakSession, 'created_at' | 'date'>[]> {
    if (!userId || userId === 'guest') return [];

    const startDate = toothbrush.startDate.slice(0, 10); // Extract YYYY-MM-DD
    const endDate = toothbrush.endDate 
      ? toothbrush.endDate.slice(0, 10) 
      : getLocalDateString(); // Use today if no end date

    return this.getBrushingLogsForPeriod(userId, startDate, endDate);
  }

  /**
   * Gets the count of brushing sessions for a specific toothbrush.
   */
  static async getBrushingCountForToothbrush(
    userId: string,
    toothbrush: Toothbrush
  ): Promise<number> {
    if (!userId || userId === 'guest') return 0;

    try {
      // First try to get count using direct toothbrush_id relationship
      const directCount = await this.getBrushingLogsByToothbrushId(userId, toothbrush.id);
      
      // If we have direct relationships, use that count
      if (directCount.length > 0) {
        return directCount.length;
      }

      // Fall back to date-based query for older data or if no direct relationships exist
      const dateBased = await this.getBrushingLogsForToothbrush(userId, toothbrush);
      return dateBased.length;
    } catch (error) {
      console.error('Error getting brushing count for toothbrush:', error);
      return 0;
    }
  }

  /**
   * Gets the current toothbrush ID for a user (for linking new brushing sessions)
   */
  static async getCurrentToothbrushId(userId: string): Promise<string | null> {
    if (!userId || userId === 'guest') {
      console.log('getCurrentToothbrushId: Skipping for guest user');
      return null;
    }

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
    if (!userId || userId === 'guest') {
      console.log('Skipping toothbrush linking for guest user');
      return;
    }

    console.log('🔗 Attempting to link brushing session to toothbrush:', { userId, brushingLogId });

    try {
      // First, try to get current toothbrush ID from backend
      let currentToothbrushId = await this.getCurrentToothbrushId(userId);
      
      if (!currentToothbrushId) {
        console.log('❌ No current toothbrush found in backend, trying to sync local data...');
        
        // Try to get local toothbrush data and sync to backend
        const localData = await this.getToothbrushData();
        if (localData.current) {
          console.log('📤 Found local toothbrush, syncing to backend:', localData.current.id);
          
          // Sync to backend with proper is_current flag
          const toothbrushToSync = { ...localData.current, user_id: userId };
          await this.syncToothbrushToBackend(toothbrushToSync);
          
          // Try again to get the ID
          currentToothbrushId = await this.getCurrentToothbrushId(userId);
        }
      }

      if (!currentToothbrushId) {
        console.log('❌ Still no current toothbrush found after sync attempt');
        return;
      }

      console.log('✅ Found current toothbrush ID:', currentToothbrushId);

      // Link the brushing session
      const { error } = await supabase
        .from('brushing_logs')
        .update({ toothbrush_id: currentToothbrushId })
        .eq('id', brushingLogId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error updating brushing log with toothbrush_id:', error);
        throw error;
      }

      console.log('✅ Successfully linked brushing session to toothbrush');
    } catch (error) {
      console.error('❌ Error linking brushing to toothbrush:', error);
    }
  }

  /**
   * Gets brushing logs directly linked to a specific toothbrush (more accurate than date-based)
   */
  static async getBrushingLogsByToothbrushId(
    userId: string,
    toothbrushId: string
  ): Promise<Pick<StreakSession, 'created_at' | 'date'>[]> {
    if (!userId || userId === 'guest') return [];

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
   * Syncs current toothbrush data to the backend
   */
  static async syncToothbrushToBackend(toothbrush: Toothbrush): Promise<void> {
    if (!toothbrush.user_id || toothbrush.user_id === 'guest') {
      console.log('Skipping backend sync for guest user');
      return;
    }

    try {
      console.log('📤 Syncing toothbrush to backend:', {
        id: toothbrush.id,
        name: toothbrush.name,
        user_id: toothbrush.user_id,
        is_current: !toothbrush.endDate
      });

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
          is_current: !toothbrush.endDate, // Current if no end date
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
    if (!userId || userId === 'guest') return null;

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
   * Updates toothbrush data locally and syncs to backend for authenticated users
   */
  static async updateToothbrushDataWithSync(data: ToothbrushData, userId: string): Promise<void> {
    // Always update local storage first
    await this.updateToothbrushData(data, userId);

    // Only sync to backend for authenticated users
    if (userId && userId !== 'guest') {
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
  }

  /**
   * Smart sync method that loads from backend if available, falls back to local storage
   */
  static async smartSyncToothbrushData(userId: string): Promise<ToothbrushData> {
    if (!userId || userId === 'guest') {
      // For guest users, always use local storage
      return await this.getToothbrushData();
    }

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
