import { useState, useEffect, useCallback } from 'react';
import { getDashboardStats, DashboardStats } from '../services/DashboardService';
import { useAuth } from '../context/AuthContext';
import { useBrushingGoal } from '../context/BrushingGoalContext';

export interface UseDashboardDataReturn {
  data: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardData(): UseDashboardDataReturn {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { brushingGoalMinutes } = useBrushingGoal();

  const fetchData = useCallback(async () => {
    console.log('📈 FETCHING DASHBOARD DATA:', { 
      userId: user?.id || 'guest', 
      brushingGoalMinutes 
    });
    try {
      setIsLoading(true);
      setError(null);
      
      // Use getDashboardStats for both authenticated and guest users
      const userId = user?.id || 'guest';
      const stats = await getDashboardStats(userId, brushingGoalMinutes);
      console.log('📊 Dashboard stats result:', stats);
      
      setData(stats);
      console.log('✅ Dashboard data set successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, brushingGoalMinutes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
} 