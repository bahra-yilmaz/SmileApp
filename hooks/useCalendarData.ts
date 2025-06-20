import { useState, useEffect, useCallback } from 'react';
import { getCalendarBrushingData } from '../services/DashboardService';
import { useAuth } from '../context/AuthContext';

export interface UseCalendarDataReturn {
  brushingData: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCalendarData(): UseCalendarDataReturn {
  const [brushingData, setBrushingData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await getCalendarBrushingData(user.id);
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
    isLoading,
    error,
    refetch,
  };
} 