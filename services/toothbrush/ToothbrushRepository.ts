import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Toothbrush, ToothbrushData } from './ToothbrushTypes';

/**
 * Unified Toothbrush Repository - Single Source of Truth
 * 
 * Architecture:
 * - Backend-first: All data stored in Supabase (authenticated users only)
 * - Local caching: AsyncStorage for offline access
 * - Clean separation: Repository pattern with clear responsibilities
 * 
 * Note: Toothbrush tracking is only available for authenticated users.
 * Guest users should use other services for their basic brushing logs.
 */
export class ToothbrushRepository {
  private static readonly CACHE_KEY = 'toothbrush_data';

  // ========================================================================
  // BACKEND OPERATIONS (Primary Data Source)
  // ========================================================================

  /**
   * Fetch all toothbrush data for a user from backend
   */
  static async fetchFromBackend(userId: string): Promise<ToothbrushData> {
    try {
      console.log('📡 Fetching toothbrush data from backend for user:', userId);

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

      const result: ToothbrushData = {
        current: currentData ? this.mapFromBackend(currentData) : null,
        history: (historyData || []).map(this.mapFromBackend),
      };

      console.log('✅ Fetched toothbrush data from backend:', {
        hasCurrent: !!result.current,
        historyCount: result.history.length
      });

      return result;
    } catch (error) {
      console.error('❌ Error fetching from backend:', error);
      throw error;
    }
  }

  /**
   * Save toothbrush data to backend
   */
  static async saveToBackend(userId: string, data: ToothbrushData): Promise<void> {
    try {
      console.log('💾 Saving toothbrush data to backend for user:', userId);

      // CRITICAL: First, set all existing toothbrushes for this user to is_current = false
      // This prevents unique constraint violations when creating a new current toothbrush
      const { error: updateError } = await supabase
        .from('toothbrushes')
        .update({ is_current: false })
        .eq('user_id', userId)
        .eq('is_current', true);

      if (updateError) {
        console.error('❌ Error updating existing current toothbrush:', updateError);
        throw updateError;
      }

      // Now save the new current toothbrush (if any)
      if (data.current) {
        await this.upsertToothbrush(userId, data.current, true);
      }

      // Save history toothbrushes (these should all be is_current = false)
      for (const historyItem of data.history) {
        await this.upsertToothbrush(userId, historyItem, false);
      }

      console.log('✅ Successfully saved toothbrush data to backend');
    } catch (error) {
      console.error('❌ Error saving to backend:', error);
      throw error;
    }
  }

  /**
   * Upsert a single toothbrush to backend
   */
  private static async upsertToothbrush(userId: string, toothbrush: Toothbrush, isCurrent: boolean): Promise<void> {
    const { error } = await supabase
      .from('toothbrushes')
      .upsert({
        id: toothbrush.id,
        user_id: userId,
        type: toothbrush.type,
        purpose: toothbrush.purpose,
        name: toothbrush.name || null,
        start_date: toothbrush.startDate,
        end_date: toothbrush.endDate || null,
        is_current: isCurrent,
        created_at: toothbrush.created_at,
      }, {
        onConflict: 'id'
      });

    if (error) {
      console.error('❌ Error upserting toothbrush:', error);
      throw error;
    }
  }

  /**
   * Get the current toothbrush ID for linking brushing sessions
   */
  static async getCurrentToothbrushId(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('toothbrushes')
        .select('id')
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle();

      if (error) throw error;
      return data?.id || null;
    } catch (error) {
      console.error('❌ Error getting current toothbrush ID:', error);
      return null;
    }
  }

  /**
   * Link a brushing session to the current toothbrush
   */
  static async linkBrushingSession(userId: string, brushingLogId: string): Promise<void> {
    try {
      const currentToothbrushId = await this.getCurrentToothbrushId(userId);
      
      if (!currentToothbrushId) {
        console.warn('⚠️ No current toothbrush found for linking');
        return;
      }

      const { error } = await supabase
        .from('brushing_logs')
        .update({ toothbrush_id: currentToothbrushId })
        .eq('id', brushingLogId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log('✅ Linked brushing session to toothbrush:', currentToothbrushId);
    } catch (error) {
      console.error('❌ Error linking brushing session:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Get brushing count for a specific toothbrush
   */
  static async getBrushingCount(userId: string, toothbrushId: string): Promise<number> {
    try {
      // Try direct relationship first
      const { data: directData, error: directError } = await supabase
        .from('brushing_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('toothbrush_id', toothbrushId);

      if (!directError && directData !== null) {
        return directData.length || 0;
      }

      console.log('📝 No direct relationships found for toothbrush:', toothbrushId);
      return 0;
    } catch (error) {
      console.error('❌ Error getting brushing count:', error);
      return 0;
    }
  }

  // ========================================================================
  // LOCAL CACHE OPERATIONS (Offline Support)
  // ========================================================================

  /**
   * Cache toothbrush data locally
   */
  static async cacheData(data: ToothbrushData): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      console.log('💾 Cached toothbrush data locally');
    } catch (error) {
      console.error('❌ Error caching locally:', error);
    }
  }

  /**
   * Get cached toothbrush data
   */
  static async getCached(): Promise<ToothbrushData> {
    try {
      const cached = await AsyncStorage.getItem(this.CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.error('❌ Error getting cached data:', error);
    }

    // Return empty data if no cache
    return { current: null, history: [] };
  }

  // ========================================================================
  // UNIFIED PUBLIC API
  // ========================================================================

  /**
   * Get toothbrush data (backend-first with local fallback)
   */
  static async getData(userId: string): Promise<ToothbrushData> {
    try {
      // Try backend first
      const backendData = await this.fetchFromBackend(userId);
      
      // Cache the result
      await this.cacheData(backendData);
      
      return backendData;
    } catch (error) {
      console.error('❌ Backend fetch failed, using cache:', error);
      
      // Fallback to cache
      return await this.getCached();
    }
  }

  /**
   * Save toothbrush data to both backend and local cache
   * Now uses the new counter system automatically via database triggers
   */
  static async saveData(userId: string, data: ToothbrushData): Promise<void> {
    console.log('💾 Saving toothbrush data for user:', userId);

    try {
      // Save current toothbrush to backend
      if (data.current) {
        // CRITICAL: First clear any existing current toothbrushes to avoid unique constraint violation
        console.log('🔄 Clearing existing current toothbrushes for user:', userId);
        const { error: updateError } = await supabase
          .from('toothbrushes')
          .update({ is_current: false })
          .eq('user_id', userId)
          .eq('is_current', true);

        if (updateError) {
          console.error('❌ Error clearing existing current toothbrushes:', updateError);
          throw updateError;
        }

        // Now safely insert/update the new current toothbrush
        const { error: upsertError } = await supabase
          .from('toothbrushes')
          .upsert({
            id: data.current.id,
            user_id: data.current.user_id,
            name: data.current.name,
            start_date: data.current.startDate,
            end_date: data.current.endDate,
            type: data.current.type,
            purpose: data.current.purpose,
            is_current: true,
            created_at: data.current.created_at,
            // Note: brushing_count will be managed by database triggers
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('❌ Error upserting current toothbrush:', upsertError);
          throw upsertError;
        }
      }

      // Save history items to backend
      for (const historyItem of data.history) {
        const { error: historyError } = await supabase
          .from('toothbrushes')
          .upsert({
            id: historyItem.id,
            user_id: historyItem.user_id,
            name: historyItem.name,
            start_date: historyItem.startDate,
            end_date: historyItem.endDate,
            type: historyItem.type,
            purpose: historyItem.purpose,
            is_current: false,
            created_at: historyItem.created_at,
            // Note: brushing_count for history items is preserved
          }, {
            onConflict: 'id'
          });

        if (historyError) {
          console.warn('⚠️ Warning saving history item:', historyError);
        }
      }

      // Cache the data locally
      await this.cacheData(data);
      console.log('✅ Successfully saved toothbrush data');

    } catch (error) {
      console.error('❌ Error saving toothbrush data:', error);
      throw error;
    }
  }

  // ========================================================================
  // HELPER METHODS
  // ========================================================================

  /**
   * Map backend data to frontend model
   */
  private static mapFromBackend(backendData: any): Toothbrush {
    return {
      id: backendData.id,
      user_id: backendData.user_id,
      type: backendData.type,
      purpose: backendData.purpose,
      name: backendData.name,
      startDate: backendData.start_date,
      endDate: backendData.end_date,
      created_at: backendData.created_at,
    };
  }

  /**
   * Delete a toothbrush from history
   */
  static async deleteFromHistory(toothbrushId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('toothbrushes')
        .delete()
        .eq('id', toothbrushId);

      if (error) throw error;
      console.log('✅ Deleted toothbrush from history:', toothbrushId);
    } catch (error) {
      console.error('❌ Error deleting toothbrush:', error);
      throw error;
    }
  }
} 