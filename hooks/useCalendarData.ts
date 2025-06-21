import { useState, useEffect, useCallback } from 'react';
import { getCalendarBrushingData } from '../services/DashboardService';
import { useAuth } from '../context/AuthContext';
import { useBrushingGoal } from '../context/BrushingGoalContext';

export interface UseCalendarDataReturn {
  brushingData: Record<string, number>;
  brushingFrequency: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCalendarData(): UseCalendarDataReturn {
  const [brushingData, setBrushingData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { brushingFrequency } = useBrushingGoal();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const userId = user?.id || 'guest';
      const data = await getCalendarBrushingData(userId);
      
      setBrushingData(data);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    brushingData,
    brushingFrequency,
    isLoading,
    error,
    refetch,
  };
} 