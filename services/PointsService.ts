import supabase from './supabaseClient';

/**
 * Service responsible for reading and updating the user\'s overall points.
 *
 * We currently keep a single cumulative \`points\` integer column in the
 * \`users\` table.  Each time a brushing session is saved we increment this
 * column by the number of points earned for that session.
 *
 * NOTE:  This implementation performs a simple read-then-write update.  In the
 * future we can migrate to a Postgres function or \`UPDATE ... SET points = points + x\`
 * once Supabase exposes a safe, atomic helper for that pattern.
 */
export class PointsService {
  /**
   * Increment the user\'s total points.
   *
   * @param userId      The user\'s UUID (authenticated or guest)
   * @param deltaPoints Number of points to add (must be > 0)
   * @returns The new total points for the user (if fetch succeeds)
   */
  static async addPoints(userId: string, deltaPoints: number): Promise<AddPointsResult | null> {
    if (!userId) throw new Error('User ID is required');
    if (deltaPoints <= 0) {
      const total = await this.getPoints(userId);
      return { newPoints: total, newStage: getStageForPoints(total) };
    }

    // -----------------------------------------------------------------------
    // 1) Fetch current points (may be null if first time)
    // -----------------------------------------------------------------------
    const { data: currentData, error: fetchError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('❌ Failed to fetch current user points:', fetchError);
      throw fetchError;
    }

    const currentPoints = currentData?.points ?? 0;
    const newPoints = currentPoints + deltaPoints;
    const newStage = getStageForPoints(newPoints);

    // -----------------------------------------------------------------------
    // 2) Update points in the database.  We use upsert so that in the unlikely
    //    event the user row doesn\'t exist yet (e.g., race condition for a new
    //    signup), we still create it with a sensible default.
    // -----------------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('users')
      .upsert(
        { id: userId, points: newPoints },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    if (updateError) {
      console.error('❌ Failed to update user points:', updateError);
      throw updateError;
    }

    return { newPoints, newStage };
  }

  /**
   * Get the user\'s current total points.
   */
  static async getPoints(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data?.points ?? 0;
  }

  /**
   * Fallback: sum earned_points from brushing_logs when users.points is null.
   */
  static async calculateTotalFromLogs(userId: string): Promise<number> {
    const { supabase } = await import('./supabaseClient');
    const { data, error } = await supabase
      .from('brushing_logs')
      .select('earned_points')
      .eq('user_id', userId);
    if (error) throw error;
    return (data ?? []).reduce((sum: number, row: any) => sum + (row.earned_points ?? 0), 0);
  }
}

// -----------------------------------------------------------------------------
// Points Stage Helpers
// -----------------------------------------------------------------------------
export type PointsStage = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Returns the stage for a given points total based on the ranges:
 * 1:   < 0   (shouldn\'t happen) → 1
 * 1:   0               →   1
 * 2:   1   –  299      →   2
 * 3:   300 –  999      →   3
 * 4:   1000 – 2499     →   4
 * 5:   2500 – 4999     →   5
 * 6:   5000 – 10000    →   6 (cap)
 */
export function getStageForPoints(totalPoints: number): PointsStage {
  if (totalPoints >= 5000) return 6;
  if (totalPoints >= 2500) return 5;
  if (totalPoints >= 1000) return 4;
  if (totalPoints >= 300) return 3;
  if (totalPoints >= 1) return 2;
  return 1; // 0 points or negative safeguard
}

/**
 * Convenience wrapper to get the current user\'s points stage.
 */
export async function getUserStage(userId: string): Promise<PointsStage> {
  const total = await PointsService.getPoints(userId);
  return getStageForPoints(total);
}

// Augment addPoints to return both points and stage without breaking API
export interface AddPointsResult {
  newPoints: number;
  newStage: PointsStage;
} 