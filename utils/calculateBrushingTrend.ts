export interface BrushingLog {
  'duration-seconds': number;
  created_at: string;
}

export enum BrushingTrend {
  IMPROVING_CONSISTENTLY = 'IMPROVING_CONSISTENTLY', // Getting better and stable
  IMPROVING_SLIGHTLY = 'IMPROVING_SLIGHTLY', // General upward trend
  DECLINING = 'DECLINING', // Getting worse
  CONSISTENT_HIGH = 'CONSISTENT_HIGH', // Stable and meeting goal
  CONSISTENT_LOW = 'CONSISTENT_LOW', // Stable but below goal
  ERRATIC = 'ERRATIC', // Highly variable, no clear trend
  STABLE = 'STABLE', // No significant change
  NOT_ENOUGH_DATA = 'NOT_ENOUGH_DATA', // Not enough logs to analyze
  NEW_USER = 'NEW_USER', // Very few logs
}

export interface BrushingTrendResult {
  trend: BrushingTrend;
  averageLast5: number;
  averagePrevious5: number;
}

const MIN_LOGS_FOR_TREND = 10;
const MIN_LOGS_FOR_ANALYSIS = 3;

/**
 * Analyzes the last 10 brushing logs to determine the user's brushing trend.
 * @param logs - An array of recent brushing logs, sorted newest to oldest.
 * @param targetTimeInSec - The user's target brushing time in seconds.
 * @returns An object containing the trend and calculated averages.
 */
export function calculateBrushingTrend(
  logs: BrushingLog[],
  targetTimeInSec: number
): BrushingTrendResult {
  if (logs.length < MIN_LOGS_FOR_ANALYSIS) {
    return {
      trend: BrushingTrend.NEW_USER,
      averageLast5: 0,
      averagePrevious5: 0,
    };
  }
  
  if (logs.length < MIN_LOGS_FOR_TREND) {
    return {
      trend: BrushingTrend.NOT_ENOUGH_DATA,
      averageLast5: 0,
      averagePrevious5: 0,
    };
  }

  // Split logs into the most recent 5 and the 5 before that
  const last5Logs = logs.slice(0, 5);
  const previous5Logs = logs.slice(5, 10);

  const getAverage = (arr: BrushingLog[]) =>
    arr.reduce((sum, log) => sum + log['duration-seconds'], 0) / arr.length;

  const averageLast5 = getAverage(last5Logs);
  const averagePrevious5 = getAverage(previous5Logs);

  const trendDifference = averageLast5 - averagePrevious5;
  const percentageChange = (trendDifference / averagePrevious5) * 100;
  
  const getStandardDeviation = (arr: BrushingLog[], avg: number) => {
      const squareDiffs = arr.map(log => Math.pow(log['duration-seconds'] - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / arr.length;
      return Math.sqrt(avgSquareDiff);
  }
  
  const stdDevLast5 = getStandardDeviation(last5Logs, averageLast5);

  // High variability means the trend is erratic
  if (stdDevLast5 > 45) { // e.g., >45 seconds deviation on average
      return { trend: BrushingTrend.ERRATIC, averageLast5, averagePrevious5 };
  }

  // Trend analysis
  if (percentageChange > 15) {
    return { trend: BrushingTrend.IMPROVING_CONSISTENTLY, averageLast5, averagePrevious5 };
  } else if (percentageChange > 5) {
    return { trend: BrushingTrend.IMPROVING_SLIGHTLY, averageLast5, averagePrevious5 };
  } else if (percentageChange < -10) {
    return { trend: BrushingTrend.DECLINING, averageLast5, averagePrevious5 };
  } else {
    // If stable, check performance against target
    if (averageLast5 >= targetTimeInSec) {
        return { trend: BrushingTrend.CONSISTENT_HIGH, averageLast5, averagePrevious5 };
    } else if (averageLast5 < targetTimeInSec * 0.75) {
        return { trend: BrushingTrend.CONSISTENT_LOW, averageLast5, averagePrevious5 };
    }
    return { trend: BrushingTrend.STABLE, averageLast5, averagePrevious5 };
  }
} 