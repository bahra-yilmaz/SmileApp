import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BRUSHING_GOAL_KEY = 'brushing_time_goal';
const DEFAULT_BRUSHING_GOAL = 2; // 2 minutes default

interface BrushingGoalContextType {
  brushingGoalMinutes: number;
  setBrushingGoalMinutes: (minutes: number) => Promise<void>;
  isLoading: boolean;
}

const BrushingGoalContext = createContext<BrushingGoalContextType | undefined>(undefined);

interface BrushingGoalProviderProps {
  children: ReactNode;
}

export const BrushingGoalProvider: React.FC<BrushingGoalProviderProps> = ({ children }) => {
  const [brushingGoalMinutes, setBrushingGoalState] = useState<number>(DEFAULT_BRUSHING_GOAL);
  const [isLoading, setIsLoading] = useState(true);

  // Load brushing goal from storage on app start
  useEffect(() => {
    const loadBrushingGoal = async () => {
      try {
        const stored = await AsyncStorage.getItem(BRUSHING_GOAL_KEY);
        if (stored !== null) {
          const goal = parseFloat(stored);
          if (!isNaN(goal) && goal > 0) {
            setBrushingGoalState(goal);
          }
        }
      } catch (error) {
        console.error('Error loading brushing goal:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrushingGoal();
  }, []);

  // Update brushing goal and save to storage
  const setBrushingGoalMinutes = async (minutes: number) => {
    try {
      if (minutes <= 0) {
        throw new Error('Brushing goal must be positive');
      }
      
      setBrushingGoalState(minutes);
      await AsyncStorage.setItem(BRUSHING_GOAL_KEY, minutes.toString());
    } catch (error) {
      console.error('Error saving brushing goal:', error);
      throw error;
    }
  };

  const value = {
    brushingGoalMinutes,
    setBrushingGoalMinutes,
    isLoading,
  };

  return <BrushingGoalContext.Provider value={value}>{children}</BrushingGoalContext.Provider>;
};

export const useBrushingGoal = () => {
  const context = useContext(BrushingGoalContext);
  if (context === undefined) {
    throw new Error('useBrushingGoal must be used within a BrushingGoalProvider');
  }
  return context;
}; 