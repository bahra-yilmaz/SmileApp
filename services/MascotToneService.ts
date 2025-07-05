import AsyncStorage from '@react-native-async-storage/async-storage';
import supabase from './supabaseClient';

/**
 * Storage key used for guests / offline persistence.
 */
const TONE_STORAGE_KEY = 'mascot_tone_preference';

/**
 * Centralised service to get / set the mascot (Nubo) tone.
 *
 * Behaviour mirrors LanguageService:
 * – Authenticated users: preference is saved in `public.users.mascot_tone` and
 *   also cached locally as fallback.
 * – Guests: preference is stored only in AsyncStorage.
 *
 * All methods swallow backend‐related errors so the UI stays responsive even
 * offline or when RLS is mis-configured.
 */
export class MascotToneService {
  /**
   * Fetch the tone for a given user from the DB (returns null if none saved).
   */
  static async getUserTone(userId: string): Promise<string | null> {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('mascot_tone')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user mascot tone:', error);
        return null;
      }

      return (data?.mascot_tone as string) ?? null;
    } catch (error) {
      console.error('Failed to fetch mascot tone:', error);
      return null;
    }
  }

  /**
   * Persist the mascot tone for a user. Uses `upsert` so it also works when the
   * row does not yet exist (e.g. brand-new guest promoted to auth user).
   */
  static async setUserTone(userId: string, toneId: string): Promise<void> {
    if (!userId) throw new Error('User ID is required');

    try {
      const upsertPromise = supabase
        .from('users')
        .upsert(
          { id: userId, mascot_tone: toneId },
          { onConflict: 'id', ignoreDuplicates: false }
        )
        .select();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout after 5 seconds')), 5000)
      );

      const { error } = await Promise.race([upsertPromise, timeoutPromise]);

      if (error) {
        console.error('Database upsert error (mascot tone):', error);
        throw error;
      }

      // Also cache locally
      await AsyncStorage.setItem(TONE_STORAGE_KEY, toneId);
    } catch (error) {
      console.error('Failed to set mascot tone in DB, saving locally as fallback:', error);
      // Fallback – local cache so preference is not lost
      await AsyncStorage.setItem(TONE_STORAGE_KEY, toneId);
      throw error; // re-throw so UI can react if desired
    }
  }

  /**
   * Load the mascot tone to be used at app start / screen mount.
   * Strategy:
   *   1. Try DB (if authenticated)
   *   2. Fallback to AsyncStorage
   *   3. Default to 'supportive'
   * If we have a local value but no DB value, we attempt to migrate it.
   */
  static async loadUserTone(userId?: string): Promise<string> {
    let toneId: string | null = null;
    let localTone: string | null = null;
    let dbTone: string | null = null;

    if (userId) {
      dbTone = await this.getUserTone(userId);
      toneId = dbTone;
    }

    try {
      localTone = await AsyncStorage.getItem(TONE_STORAGE_KEY);
      if (!toneId) {
        toneId = localTone;
      }
    } catch (error) {
      console.warn('Failed to load mascot tone from local storage:', error);
    }

    // Migrate local preference to DB if necessary
    if (userId && localTone && !dbTone) {
      try {
        await this.setUserTone(userId, localTone);
      } catch (error) {
        console.error('Failed to migrate mascot tone to database:', error);
      }
    }

    // Default value
    if (!toneId) toneId = 'supportive';

    return toneId;
  }

  /**
   * Change the tone and persist according to auth state.
   */
  static async changeTone(toneId: string, userId?: string): Promise<void> {
    // Always save locally first so the UI feels instant, even offline.
    await AsyncStorage.setItem(TONE_STORAGE_KEY, toneId);

    if (userId) {
      try {
        await this.setUserTone(userId, toneId);
      } catch (error) {
        // Already logged inside setUserTone – swallow so caller can decide UX.
      }
    }
  }
} 