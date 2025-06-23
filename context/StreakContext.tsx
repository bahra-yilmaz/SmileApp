import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreakService, StreakData } from '../services/StreakService';
import { useAuth } from './AuthContext';

interface StreakContextType {
  currentStreak: number;
  isLoading: boolean;
  error: string | null;
  refreshStreak: () => Promise<void>;
  checkDailyGoal: () => Promise<{
    hitGoalToday: boolean;
    sessionsToday: number;
    requiredSessions: number;
    remainingSessions: number;
  }>;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export function useStreak() {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider');
  }
  return context;
}

interface StreakProviderProps {
  children: React.ReactNode;
}

export function StreakProvider({ children }: StreakProviderProps) {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize StreakService
  useEffect(() => {
    StreakService.initialize();
  }, []);

  // Load initial streak when user changes
  useEffect(() => {
    const loadInitialStreak = async () => {
      if (!user?.id) {
        setCurrentStreak(0);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const streak = await StreakService.getCurrentStreak(user.id);
        setCurrentStreak(streak);
      } catch (err) {
        console.error('Error loading initial streak:', err);
        setError(err instanceof Error ? err.message : 'Failed to load streak');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialStreak();
  }, [user?.id]);

  // Subscribe to streak updates
  useEffect(() => {
    const unsubscribe = StreakService.on('streak-updated', (data: any) => {
      if (data.userId === user?.id) {
        setCurrentStreak(data.newStreak);
      }
    });

    return unsubscribe;
  }, [user?.id]);

  const refreshStreak = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const streak = await StreakService.getCurrentStreak(user.id, { forceRefresh: true });
      setCurrentStreak(streak);
    } catch (err) {
      console.error('Error refreshing streak:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh streak');
    } finally {
      setIsLoading(false);
    }
  };

  const checkDailyGoal = async () => {
    if (!user?.id) {
      return {
        hitGoalToday: false,
        sessionsToday: 0,
        requiredSessions: 2,
        remainingSessions: 2
      };
    }

    try {
      return await StreakService.checkDailyGoalStatus(user.id);
    } catch (err) {
      console.error('Error checking daily goal:', err);
      return {
        hitGoalToday: false,
        sessionsToday: 0,
        requiredSessions: 2,
        remainingSessions: 2
      };
    }
  };

  const value: StreakContextType = {
    currentStreak,
    isLoading,
    error,
    refreshStreak,
    checkDailyGoal
  };

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
} 