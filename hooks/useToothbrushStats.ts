import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ToothbrushService,
  ToothbrushUsageStats,
  ToothbrushDisplayData,
  Toothbrush,
} from '../services/toothbrush';
import { useAuth } from '../context/AuthContext';
import { eventBus } from '../utils/EventBus';

export interface UseToothbrushStatsReturn {
  stats: ToothbrushUsageStats | null;
  displayData: ToothbrushDisplayData | null;
  currentToothbrush: Toothbrush | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

/**
 * Custom hook for accessing all toothbrush-related data and statistics.
 * It uses the modular ToothbrushService to provide both raw stats and
 * display-ready data for the UI.
 */
export function useToothbrushStats(): UseToothbrushStatsReturn {
  const [stats, setStats] = useState<ToothbrushUsageStats | null>(null);
  const [displayData, setDisplayData] = useState<ToothbrushDisplayData | null>(null);
  const [currentToothbrush, setCurrentToothbrush] = useState<Toothbrush | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { t } = useTranslation();

  const fetchStats = useCallback(async (isRefresh = false) => {
    // On subsequent fetches (non-refresh), don't show loading spinner
    // to avoid UI flicker when refreshing in the background.
    if (!isRefresh) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const userId = user?.id || 'guest';
      const info = await ToothbrushService.getToothbrushInfo(userId, t);

      if (info) {
        setStats(info.stats);
        setDisplayData(info.displayData);
      } else {
        // Handle case where there is no toothbrush data
        setStats(null);
        setDisplayData(null);
      }

      // Also get current toothbrush data for components that need the name, brand, etc.
      const toothbrush = await ToothbrushService.getCurrentToothbrush();
      setCurrentToothbrush(toothbrush);
    } catch (err) {
      console.error('Error fetching toothbrush stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch toothbrush stats');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, t]);

  // The refresh function is now just a wrapper around fetchStats
  const refreshStats = useCallback(async () => {
    await fetchStats(true);
  }, [fetchStats]);

  useEffect(() => {
    // Initial fetch
    fetchStats();
  }, [fetchStats]);

  // Listen for brushing completion events to refresh stats in the background
  useEffect(() => {
    const handleBrushingCompleted = () => {
      console.log('🦷 Brushing completed, refreshing toothbrush stats in the background...');
      refreshStats();
    };

    const unsubscribe = eventBus.on('brushing-completed', handleBrushingCompleted);

    return () => {
      eventBus.off('brushing-completed', unsubscribe);
    };
  }, [refreshStats]);

  return {
    stats,
    displayData,
    currentToothbrush,
    isLoading,
    error,
    refreshStats,
  };
} 