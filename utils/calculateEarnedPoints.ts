import { subDays, startOfDay } from 'date-fns';

export interface BrushingSession {
  /** Duration user brushed in seconds */
  actualTimeInSec: number;
  /** Optional stored target for that session. Falls back to global target. */
  targetTimeInSec?: number;
  date?: string;
}

/**
 * Calculates points earned for a brushing session.
 *
 * Scoring rules:
 * • Base points = (actualTimeInSec / targetTimeInSec) × 100
 * • Bonus = 100 + (10 × streak) if the previous sessions (in recentSessions)
 *   hit the target consecutively.
 *
 * @param targetTimeInSec   Global brushing goal (seconds)
 * @param actualTimeInSec   Duration of current session (seconds)
 * @param recentSessions    Previous sessions (newest first)
 * @param aimedSessionsPerDay  Aimed sessions per day
 * @returns Total points earned for this session
 */
export interface EarnedPointsResult {
  basePoints: number;
  bonusPoints: number;
  total: number;
  timeStreak: number; // Consecutive sessions that hit target time
  dailyStreak: number; // Consecutive days that hit aimed sessions per day
}

export function calculateEarnedPoints(
  targetTimeInSec: number,
  actualTimeInSec: number,
  recentSessions: BrushingSession[] = [],
  aimedSessionsPerDay: number,
): EarnedPointsResult {
  if (targetTimeInSec <= 0) {
    throw new Error('targetTimeInSec must be greater than 0');
  }
  if (aimedSessionsPerDay <= 0) {
    throw new Error('aimedSessionsPerDay must be greater than 0');
  }

  // ---------------------------------------------------------------------------
  // 1) Base points — ratio of actual to target time
  // ---------------------------------------------------------------------------
  const ratio = actualTimeInSec / targetTimeInSec;

  // Determine consecutive previous sessions that also hit >= 100 % of target
  let timeStreak = 0;
  for (const session of recentSessions) {
    const targetForSession = session.targetTimeInSec ?? targetTimeInSec;
    if (session.actualTimeInSec >= targetForSession) {
      timeStreak += 1;
    } else {
      break; // streak broken
    }
  }

  let basePoints: number;
  if (actualTimeInSec >= targetTimeInSec) {
    basePoints = 100 + 10 * timeStreak;
  } else {
    basePoints = Math.round(ratio * 100);
    // Ensure cannot exceed 100 when brushing < target
    if (basePoints > 100) basePoints = 100;
  }

  // ---------------------------------------------------------------------------
  // 2) Bonus points — consecutive previous days hitting daily brushing target
  // ---------------------------------------------------------------------------
  // Build a map of date (YYYY-MM-DD) -> count of sessions on that date
  const countByDate = new Map<string, number>();
  for (const session of recentSessions) {
    const dateStr = session.date ?? (session as any).created_at?.slice(0, 10);
    if (!dateStr) continue;
    countByDate.set(dateStr, (countByDate.get(dateStr) ?? 0) + 1);
  }

  let dailyStreak = 0;
  // Start from yesterday; current day should not be considered
  let dayPointer = subDays(startOfDay(new Date()), 1);
  while (true) {
    const dateStr = dayPointer.toISOString().slice(0, 10);
    const count = countByDate.get(dateStr) ?? 0;
    if (count >= aimedSessionsPerDay) {
      dailyStreak += 1;
      dayPointer = subDays(dayPointer, 1);
    } else {
      break;
    }
  }

  const bonusPoints = dailyStreak * 50;

  return {
    basePoints,
    bonusPoints,
    total: basePoints + bonusPoints,
    timeStreak,
    dailyStreak,
  };
} 