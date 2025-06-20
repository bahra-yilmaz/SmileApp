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
  targetTimeInSec?: number; // Make optional since we'll fetch from users table
  aimedSessionsPerDay: number;
}): Promise<InsertBrushingLogResult> {
  const { userId, actualTimeInSec, aimedSessionsPerDay } = params;

  // -------------------------------------------------------------------------
  // 1) Fetch user's target time from users table
  // -------------------------------------------------------------------------
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('target_time_in_sec')
    .eq('id', userId)
    .maybeSingle();

  let targetTimeInSec = params.targetTimeInSec || 120; // Default 2 minutes

  if (userError) {
    console.error('Error fetching user target time:', userError);
  } else if (userData?.target_time_in_sec) {
    targetTimeInSec = userData.target_time_in_sec;
  } else if (userData) {
    // User exists but target_time_in_sec is null, update it to default
    console.log('User exists but target_time_in_sec is null, updating to default...');
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ target_time_in_sec: 120 })
      .eq('id', userId);

    if (!updateError) {
      targetTimeInSec = 120;
    }
  } else {
    // User doesn't exist - this shouldn't happen for authenticated users
    // For authenticated users, the user record should exist from signup/onboarding
    console.warn('⚠️ Authenticated user not found in database. Using default target time.');
    targetTimeInSec = 120;
  }

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

  const recentSessions: BrushingSession[] = (recent ?? []).map((row: any) => ({
    actualTimeInSec: row['duration-seconds'],
    targetTimeInSec: targetTimeInSec, // Use the current session's target
    date: row.date ?? row.created_at?.slice(0, 10),
  }));

  // -------------------------------------------------------------------------
  // 3) Calculate earned points for the current session using the helper
  // -------------------------------------------------------------------------
  const points = calculateEarnedPoints(
    targetTimeInSec,
    actualTimeInSec,
    recentSessions,
    aimedSessionsPerDay,
  );

  // -------------------------------------------------------------------------
  // 4) Insert the new brushing log
  // -------------------------------------------------------------------------
  const todayDateStr = new Date().toISOString().slice(0, 10);

  const { data: insertData, error: insertError } = await supabase
    .from('brushing_logs')
    .insert({
      user_id: userId,
      'duration-seconds': actualTimeInSec,
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