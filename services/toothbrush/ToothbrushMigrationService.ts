import { supabase } from '../supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Service to handle migration from old toothbrush counting system to new counter-based system
 * This ensures existing users' data is properly migrated
 */
export class ToothbrushMigrationService {
  private static readonly MIGRATION_KEY = 'toothbrush_counter_migration_completed';
  
  // In-memory cache to prevent repeated AsyncStorage checks (PERFORMANCE FIX)
  private static migrationStatusCache = new Map<string, boolean>();
  
  // Session-level flag to prevent repeated migration attempts (PERFORMANCE FIX)
  private static sessionMigrationAttempts = new Set<string>();

  /**
   * Check if migration has been completed for this user
   * Uses in-memory cache and session tracking for maximum performance
   */
  static async isMigrationCompleted(userId: string): Promise<boolean> {
    // Check if we already attempted migration this session
    if (this.sessionMigrationAttempts.has(userId)) {
      return true; // Assume completed if already attempted this session
    }
    
    // Check in-memory cache first (fastest - no I/O)
    if (this.migrationStatusCache.has(userId)) {
      return this.migrationStatusCache.get(userId)!;
    }
    
    try {
      const completed = await AsyncStorage.getItem(`${this.MIGRATION_KEY}_${userId}`);
      const isCompleted = completed === 'true';
      
      // Cache the result in memory for future calls
      this.migrationStatusCache.set(userId, isCompleted);
      
      return isCompleted;
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Mark migration as completed for this user
   */
  static async markMigrationCompleted(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`${this.MIGRATION_KEY}_${userId}`, 'true');
      
      // Update in-memory cache immediately for performance
      this.migrationStatusCache.set(userId, true);
      
      // Mark session as attempted to prevent future attempts
      this.sessionMigrationAttempts.add(userId);
      
      console.log('✅ Migration marked as completed for user:', userId);
    } catch (error) {
      console.error('❌ Error marking migration completed:', error);
    }
  }

  /**
   * Migrate existing toothbrush data to use the new counter system
   * This should be called once per user on app startup
   */
  static async migrateUserToothbrushes(userId: string): Promise<void> {
    console.log('🔄 Starting toothbrush migration for user:', userId);

    if (userId === 'guest') {
      console.log('⏭️ Skipping migration for guest user');
      return;
    }

    try {
      // Check if migration already completed
      const alreadyCompleted = await this.isMigrationCompleted(userId);
      if (alreadyCompleted) {
        console.log('✅ Migration already completed for user:', userId);
        return;
      }

      // Get all toothbrushes for this user
      const { data: toothbrushes, error: fetchError } = await supabase
        .from('toothbrushes')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) {
        console.error('❌ Error fetching toothbrushes for migration:', fetchError);
        throw fetchError;
      }

      if (!toothbrushes || toothbrushes.length === 0) {
        console.log('ℹ️ No toothbrushes found for user, skipping migration');
        await this.markMigrationCompleted(userId);
        return;
      }

      console.log(`🔢 Found ${toothbrushes.length} toothbrushes to migrate`);

      // Migrate each toothbrush
      for (const toothbrush of toothbrushes) {
        await this.migrateToothbrushCounter(userId, toothbrush);
      }

      // Mark migration as completed
      await this.markMigrationCompleted(userId);
      console.log('✅ Migration completed successfully for user:', userId);

    } catch (error) {
      console.error('❌ Error during toothbrush migration:', error);
      // Don't throw - migration failure shouldn't break the app
    }
  }

  /**
   * Migrate a specific toothbrush to use the counter system
   */
  private static async migrateToothbrushCounter(userId: string, toothbrush: any): Promise<void> {
    console.log('🔄 Migrating toothbrush:', toothbrush.id);

    try {
      // Skip if counter already exists and is greater than 0
      if (toothbrush.brushing_count && toothbrush.brushing_count > 0) {
        console.log('⏭️ Toothbrush already has counter:', toothbrush.brushing_count);
        return;
      }

      let count = 0;

      // First try to count by foreign key relationship
      const { data: directCount, error: directError } = await supabase
        .from('brushing_logs')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('toothbrush_id', toothbrush.id);

      if (!directError && directCount !== null) {
        count = directCount.length || 0;
        console.log(`📊 Found ${count} brushings via foreign key for toothbrush:`, toothbrush.id);
      }

      // If no direct count, try date range method
      if (count === 0) {
        const startDate = toothbrush.start_date;
        const endDate = toothbrush.end_date || new Date().toISOString();

        const { data: rangeCount, error: rangeError } = await supabase
          .from('brushing_logs')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('date', startDate.split('T')[0]) // Convert to date string
          .lte('date', endDate.split('T')[0])
          .is('toothbrush_id', null); // Only count unlinked brushings

        if (!rangeError && rangeCount !== null) {
          count = rangeCount.length || 0;
          console.log(`📊 Found ${count} brushings via date range for toothbrush:`, toothbrush.id);
        }
      }

      // Update the toothbrush with the calculated count
      const { error: updateError } = await supabase
        .from('toothbrushes')
        .update({ brushing_count: count })
        .eq('id', toothbrush.id);

      if (updateError) {
        console.error('❌ Error updating toothbrush counter:', updateError);
        throw updateError;
      }

      console.log(`✅ Migrated toothbrush ${toothbrush.id} with count: ${count}`);

    } catch (error) {
      console.error('❌ Error migrating individual toothbrush:', error);
      // Continue with other toothbrushes
    }
  }

  /**
   * Force re-migration for testing purposes
   */
  static async forceMigration(userId: string): Promise<void> {
    console.log('🔄 Forcing migration for user:', userId);
    
    // Clear the migration flag
    try {
      await AsyncStorage.removeItem(`${this.MIGRATION_KEY}_${userId}`);
    } catch (error) {
      console.warn('⚠️ Error clearing migration flag:', error);
    }

    // Run migration
    await this.migrateUserToothbrushes(userId);
  }
} 