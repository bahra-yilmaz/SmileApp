import { useState, useEffect, useCallback } from 'react';
import { ToothbrushService, ToothbrushUsageStats } from '../services/ToothbrushService';
import { useAuth } from '../context/AuthContext';
import { eventBus } from '../utils/EventBus';

export interface UseToothbrushStatsReturn {
  stats: ToothbrushUsageStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  simpleDaysInUse: number;
}

/**
 * Custom hook for accessing toothbrush statistics
 * Provides comprehensive usage stats and simple days count
 */
export function useToothbrushStats(): UseToothbrushStatsReturn {
  const [stats, setStats] = useState<ToothbrushUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simpleDaysInUse, setSimpleDaysInUse] = useState(0);
  const { user } = useAuth();

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = user?.id || 'guest';
      
      // If we have an authenticated user and no toothbrush data exists, try to initialize from database
      if (user?.id) {
        const toothbrushData = await ToothbrushService.getToothbrushData();
        if (!toothbrushData.current) {
          console.log('🦷 No toothbrush data found, attempting to initialize from database...');
          await ToothbrushService.initializeFromDatabase(user.id);
        }
      }
      
      // Fetch comprehensive stats and simple days in parallel
      const [comprehensiveStats, simpleStats] = await Promise.all([
        ToothbrushService.getCurrentToothbrushStats(userId),
        ToothbrushService.getSimpleDaysInUse(),
      ]);
      
      setStats(comprehensiveStats);
      setSimpleDaysInUse(simpleStats);
    } catch (err) {
      console.error('Error fetching toothbrush stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch toothbrush stats');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const refreshStats = useCallback(async () => {
    try {
      setError(null);
      const userId = user?.id || 'guest';
      
      // Use the new force complete refresh method
      const refreshedStats = await ToothbrushService.forceCompleteRefresh(userId);
      const simpleStats = await ToothbrushService.getSimpleDaysInUse();
      
      setStats(refreshedStats);
      setSimpleDaysInUse(simpleStats);
    } catch (err) {
      console.error('Error refreshing toothbrush stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh toothbrush stats');
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Listen for brushing completion events to refresh stats
  useEffect(() => {
    const handleBrushingCompleted = () => {
      console.log('🦷 Brushing completed, refreshing toothbrush stats...');
      refreshStats();
    };

    const unsubscribe = eventBus.on('brushing-completed', handleBrushingCompleted);
    
    return () => {
      eventBus.off('brushing-completed', unsubscribe);
    };
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    simpleDaysInUse,
  };
} 