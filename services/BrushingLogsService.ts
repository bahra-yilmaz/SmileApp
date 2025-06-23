import { supabase } from './supabaseClient';
import { calculateEarnedPoints, BrushingSession, EarnedPointsResult } from '../utils/calculateEarnedPoints';
import { subDays } from 'date-fns';
import { StreakSession } from '../utils/streakUtils';
import { StreakService } from './StreakService';
import { BrushingGoalsService } from './BrushingGoalsService';
import { getTodayLocalString } from '../utils/dateUtils';

export interface InsertBrushingLogResult extends EarnedPointsResult {
  id: string;
}

/**
 * Inserts a brushing log for the given user and returns the DB ID together with
 * the calculated points breakdown.
 *
 * Flow:
 * 1. Fetch the user's recent brushing sessions (last 10 days) for streak logic.
 * 2. Calculate earned points via `calculateEarnedPoints`.
 * 3. Persist the new brushing log in Supabase.
 * 4. Return the inserted row ID and points.
 */
export async function insertBrushingLog(params: {
  userId: string;
  actualTimeInSec: number;
  targetTimeInSec?: number; // Make optional since we'll fetch from users table
}): Promise<InsertBrushingLogResult> {
  const { userId, actualTimeInSec } = params;

  // -------------------------------------------------------------------------
  // 1) Get brushing goals from centralized service
  // -------------------------------------------------------------------------
  const goals = await BrushingGoalsService.getCurrentGoals();
  let targetTimeInSec = params.targetTimeInSec || Math.round(goals.timeTargetMinutes * 60);
  const aimedSessionsPerDay = goals.dailyFrequency;

  // -------------------------------------------------------------------------
  // 2) Fetch recent sessions (last 10 days, newest first)
  // -------------------------------------------------------------------------
  const tenDaysAgoISO = subDays(new Date(), 10).toISOString();

  const { data: recent, error: fetchError } = await supabase
    .from('brushing_logs')
    .select('"duration-seconds", date, created_at')
    .eq('user_id', userId)
    .gte('created_at', tenDaysAgoISO)
    .order('created_at', { ascending: false });

  if (fetchError) {
    throw fetchError;
  }

  const recentSessions: StreakSession[] = (recent ?? []).map((row: any) => ({
    'duration-seconds': row['duration-seconds'],
    date: row.date ?? row.created_at?.slice(0, 10),
    created_at: row.created_at,
  }));

  // -------------------------------------------------------------------------
  // 3) Calculate earned points for the current session using the helper
  // -------------------------------------------------------------------------
  // Use local timezone to match calendar view (prevents date mismatch at midnight)
  const todayDateStr = getTodayLocalString();
  const currentSession: StreakSession = {
    'duration-seconds': actualTimeInSec,
    date: todayDateStr,
    created_at: new Date().toISOString(),
  };

  const points = calculateEarnedPoints(
    targetTimeInSec,
    currentSession,
    recentSessions,
    aimedSessionsPerDay
  );

  // -------------------------------------------------------------------------
  // 4) Insert the new brushing log (store REAL brushed duration)
  // -------------------------------------------------------------------------
  //  If the user brushed longer than their goal, we still want to persist the
  //  full duration, not just the goal duration.  This value will be used for
  //  analytics and future streak calculations.

  const durationSecondsToInsert = actualTimeInSec; // always real brushed time

  const { data: insertData, error: insertError } = await supabase
    .from('brushing_logs')
    .insert({
      user_id: userId,
      'duration-seconds': durationSecondsToInsert,
      date: todayDateStr, // Now uses local timezone consistently
      earned_points: points.total,
    })
    .select('id')
    .single();

  if (insertError || !insertData) {
    throw insertError ?? new Error('Failed to insert brushing log');
  }

  // -------------------------------------------------------------------------
  // 5) Update streak service with the new session
  // -------------------------------------------------------------------------
  try {
    await StreakService.updateStreakAfterBrushing(userId, currentSession);
  } catch (error) {
    console.error('Error updating streak after brushing:', error);
    // Don't throw - streak update failure shouldn't break the main flow
  }

  return {
    id: insertData.id,
    ...points,
  };
}

export async function deleteBrushingLog(logId: string, userId?: string): Promise<void> {
  let query = supabase
    .from('brushing_logs')
    .delete();

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { error } = await query.eq('id', logId);

  if (error) {
    console.error('❌ Error deleting brushing log:', error);
    throw error;
  }
} 