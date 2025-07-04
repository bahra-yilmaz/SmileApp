import { subDays, startOfDay } from 'date-fns';
import { calculateStreak } from './streakUtils';
import { StreakSession } from '../services/StreakService';

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
 * @param currentSession    Current session
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
  currentSession: StreakSession,
  recentSessions: StreakSession[] = [],
  aimedSessionsPerDay: number
): EarnedPointsResult {
  if (targetTimeInSec <= 0) {
    throw new Error('targetTimeInSec must be greater than 0');
  }
  if (aimedSessionsPerDay <= 0) {
    throw new Error('aimedSessionsPerDay must be greater than 0');
  }

  // ---------------------------------------------------------------------------
  // 1) Base points — ratio of actual to target time & time-based streak
  // ---------------------------------------------------------------------------
  const { 'duration-seconds': actualTimeInSec } = currentSession;
  const ratio = actualTimeInSec / targetTimeInSec;

  // Determine consecutive previous sessions that also hit >= 100% of target
  let timeStreak = 0;
  for (const session of recentSessions) {
    if (session['duration-seconds'] >= targetTimeInSec) {
      timeStreak += 1;
    } else {
      break; // streak broken
    }
  }

  let basePoints: number;
  if (actualTimeInSec >= targetTimeInSec) {
    // If the current session meets the target, it extends the time-based streak
    basePoints = 100 + 10 * timeStreak;
  } else {
    basePoints = Math.round(ratio * 100);
    // Ensure cannot exceed 100 when brushing < target
    if (basePoints > 100) basePoints = 100;
  }

  // ---------------------------------------------------------------------------
  // 2) Bonus points — daily brushing frequency streak
  // ---------------------------------------------------------------------------
  // Combine the new session with recent ones to get the updated streak
  const allSessions = [currentSession, ...recentSessions];
  const dailyStreak = calculateStreak(allSessions, aimedSessionsPerDay);

  const bonusPoints = dailyStreak * 50;

  return {
    basePoints,
    bonusPoints,
    total: basePoints + bonusPoints,
    timeStreak: actualTimeInSec >= targetTimeInSec ? timeStreak + 1 : 0, // Reset if target not met
    dailyStreak,
  };
} 