import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBrushingGoal } from '../context/BrushingGoalContext';
import { getRecentBrushingLogs } from '../services/DashboardService';
import {
  calculateBrushingTrend,
  BrushingTrend,
  BrushingTrendResult,
  BrushingLog,
} from '../utils/calculateBrushingTrend';
import { useTranslation } from 'react-i18next';

interface UseBrushingTrendReturn {
  isLoading: boolean;
  trend: BrushingTrend | null;
  trendText: string;
  trendIcon: string;
}

const PREFIX = 'settings.brushingTrend.';

const getTrendDetails = (t: (key: string, options?: { defaultValue: string }) => string, trendResult?: BrushingTrendResult) => {
  if (!trendResult) {
    return {
      text: t(PREFIX + 'loading', { defaultValue: 'Analyzing your recent sessions...' }),
      icon: 'sync-outline',
    };
  }

  const { trend } = trendResult;

  switch (trend) {
    case BrushingTrend.IMPROVING_CONSISTENTLY:
      return { text: t(PREFIX + 'improvingConsistently', { defaultValue: 'Great consistency! Your brushing time is steadily increasing.' }), icon: 'trending-up' };
    case BrushingTrend.IMPROVING_SLIGHTLY:
      return { text: t(PREFIX + 'improvingSlightly', { defaultValue: 'Nice progress! You\'re brushing longer than before.' }), icon: 'arrow-up-circle-outline' };
    case BrushingTrend.DECLINING:
      return { text: t(PREFIX + 'declining', { defaultValue: 'Looks like your brushing times are getting shorter. Let\'s get back on track!' }), icon: 'trending-down' };
    case BrushingTrend.CONSISTENT_HIGH:
      return { text: t(PREFIX + 'consistentHigh', { defaultValue: 'Excellent! You are consistently meeting your brushing goal.' }), icon: 'checkbox-marked-circle-outline' };
    case BrushingTrend.CONSISTENT_LOW:
      return { text: t(PREFIX + 'consistentLow', { defaultValue: 'You\'re consistent, but let\'s try to brush a bit longer to meet your goal.' }), icon: 'clock-outline' };
    case BrushingTrend.ERRATIC:
      return { text: t(PREFIX + 'erratic', { defaultValue: 'Your brushing times are a bit varied. Let\'s aim for more consistency.' }), icon: 'shuffle-variant' };
    case BrushingTrend.STABLE:
      return { text: t(PREFIX + 'stable', { defaultValue: 'You have a consistent brushing routine. Keep it up!' }), icon: 'chart-line' };
    case BrushingTrend.NOT_ENOUGH_DATA:
      return { text: t(PREFIX + 'notEnoughData', { defaultValue: 'Keep brushing to unlock your trend analysis!' }), icon: 'information-outline' };
    case BrushingTrend.NEW_USER:
      return { text: t(PREFIX + 'newUser', { defaultValue: 'Welcome! Complete a few more sessions to see your progress.' }), icon: 'star-outline' };
    default:
      return { text: '', icon: 'help-circle-outline' };
  }
};


export function useBrushingTrend(): UseBrushingTrendReturn {
  const { user } = useAuth();
  const { brushingGoalMinutes } = useBrushingGoal();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [trendResult, setTrendResult] = useState<BrushingTrendResult | undefined>(undefined);

  useEffect(() => {
    async function fetchAndCalculateTrend() {
      if (!user || user.id === 'guest') {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const logs: BrushingLog[] = await getRecentBrushingLogs(user.id);
        const targetTimeInSec = brushingGoalMinutes * 60;
        const result = calculateBrushingTrend(logs, targetTimeInSec);
        setTrendResult(result);
      } catch (error) {
        console.error('Failed to get brushing trend:', error);
        setTrendResult(undefined); // Reset on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndCalculateTrend();
  }, [user, brushingGoalMinutes]);
  
  const { text, icon } = getTrendDetails(t, trendResult);

  return {
    isLoading,
    trend: trendResult?.trend ?? null,
    trendText: text,
    trendIcon: icon,
  };
} 