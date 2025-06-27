import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Simple debounce function for performance optimization
function debounce(func: Function, delay: number) {
  let timeoutId: any;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}
import {
  ToothbrushService,
  ToothbrushUsageStats,
  ToothbrushDisplayData,
  Toothbrush,
  ToothbrushDataService,
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
    if (!isRefresh) {
      setIsLoading(true);
    }
    setError(null);

    // --- Start of new caching logic ---
    // 1. On initial load, try to populate UI instantly from cache
    if (!isRefresh) {
      const cachedStats = await ToothbrushDataService.getStatsFromCache();
      if (cachedStats) {
        const userId = user?.id || 'guest';
        // Get display data from cached stats
        const info = await ToothbrushService.getToothbrushInfoFromStats(userId, t, cachedStats);
        // Separately get the current toothbrush object from the LOCAL DATA CACHE
        const toothbrushData = await ToothbrushDataService.getToothbrushData();

        if (info) {
          setStats(info.stats);
          setDisplayData(info.displayData);
          setCurrentToothbrush(toothbrushData.current); // Set the toothbrush object here
          setIsLoading(false); // We have data, so loading is done for now
        }
      }
    }
    // --- End of new caching logic ---

    try {
      const userId = user?.id || 'guest';
      // 2. Always fetch fresh data from the service
      const info = await ToothbrushService.getToothbrushInfo(userId, t);
      // And the current toothbrush object
      const toothbrush = await ToothbrushService.getCurrentToothbrush(userId);

      if (info) {
        setStats(info.stats);
        setDisplayData(info.displayData);
        setCurrentToothbrush(toothbrush); // Also update current toothbrush info
        
        // 3. Cache the fresh stats for next time
        await ToothbrushDataService.saveStatsToCache(info.stats);
      } else {
        setStats(null);
        setDisplayData(null);
        setCurrentToothbrush(null);
      }
    } catch (err) {
      console.error('Error fetching toothbrush stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch toothbrush stats');
    } finally {
      // Only set loading to false if it wasn't already done by the cache
      if (isLoading) {
        setIsLoading(false);
      }
    }
  }, [user?.id, t]);

  // Debounced refresh to prevent event storms (PERFORMANCE FIX)
  const debouncedRefresh = useCallback(
    debounce(() => {
      console.log('🦷 Debounced refresh triggered');
      fetchStats(true);
    }, 500), // 500ms debounce (INCREASED FROM 300ms)
    [fetchStats]
  );

  // The refresh function now uses debouncing for performance
  const refreshStats = useCallback(async () => {
    debouncedRefresh();
  }, [debouncedRefresh]);

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

    const handleFrequencyUpdated = () => {
      console.log('🦷 Frequency updated, refreshing toothbrush stats...');
      refreshStats();
    };

    const handleGoalUpdated = () => {
      console.log('🦷 Goal updated, refreshing toothbrush stats...');
      refreshStats();
    };

    const handleToothbrushUpdated = (payload: any) => {
      if (payload?.userId === user?.id || payload?.userId === 'guest') {
        console.log('🦷 Toothbrush updated, refreshing stats...', payload);
        refreshStats();
      }
    };

    const unsubscribeBrushing = eventBus.on('brushing-completed', handleBrushingCompleted);
    const unsubscribeFrequency = eventBus.on('frequency-updated', handleFrequencyUpdated);
    // Listen to BrushingGoalsService events that might affect toothbrush calculations
    const unsubscribeGoal = eventBus.on('brushing-goal-updated', handleGoalUpdated);
    const unsubscribeToothbrush = eventBus.on('toothbrush-updated', handleToothbrushUpdated);

    return () => {
      unsubscribeBrushing();
      unsubscribeFrequency();
      unsubscribeGoal();
      unsubscribeToothbrush();
    };
  }, [refreshStats, user?.id]);

  return {
    stats,
    displayData,
    currentToothbrush,
    isLoading,
    error,
    refreshStats,
  };
} 