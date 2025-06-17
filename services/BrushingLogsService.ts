import { supabase } from './supabaseClient';
import { calculateEarnedPoints, BrushingSession, EarnedPointsResult } from '../utils/calculateEarnedPoints';
import { subDays } from 'date-fns';

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
  targetTimeInSec: number;
  aimedSessionsPerDay: number;
}): Promise<InsertBrushingLogResult> {
  const { userId, actualTimeInSec, targetTimeInSec, aimedSessionsPerDay } = params;

  // -------------------------------------------------------------------------
  // 1) Fetch recent sessions (last 10 days, newest first)
  // -------------------------------------------------------------------------
  const tenDaysAgoISO = subDays(new Date(), 10).toISOString();

  const { data: recent, error: fetchError } = await supabase
    .from('brushing_logs')
    .select('duration_seconds, target_time_in_sec, date, created_at')
    .eq('user_id', userId)
    .gte('created_at', tenDaysAgoISO)
    .order('created_at', { ascending: false });

  if (fetchError) {
    throw fetchError;
  }

  const recentSessions: BrushingSession[] = (recent ?? []).map((row: any) => ({
    actualTimeInSec: row.duration_seconds,
    targetTimeInSec: row.target_time_in_sec ?? undefined,
    date: row.date ?? row.created_at?.slice(0, 10),
  }));

  // -------------------------------------------------------------------------
  // 2) Calculate earned points for the current session using the helper
  // -------------------------------------------------------------------------
  const points = calculateEarnedPoints(
    targetTimeInSec,
    actualTimeInSec,
    recentSessions,
    aimedSessionsPerDay,
  );

  // -------------------------------------------------------------------------
  // 3) Insert the new brushing log
  // -------------------------------------------------------------------------
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const { data: insertData, error: insertError } = await supabase
    .from('brushing_logs')
    .insert({
      user_id: userId,
      duration_seconds: actualTimeInSec,
      target_time_in_sec: targetTimeInSec,
      date: todayDateStr,
      earned_points: points.total,
    })
    .select('id')
    .single();

  if (insertError || !insertData) {
    throw insertError ?? new Error('Failed to insert brushing log');
  }

  return {
    id: insertData.id,
    ...points,
  };
} 