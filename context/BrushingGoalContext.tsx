import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { OnboardingService } from '../services/OnboardingService';

const BRUSHING_GOAL_KEY = 'brushing_time_goal';
const BRUSHING_FREQUENCY_KEY = 'brushing_frequency';
const DEFAULT_BRUSHING_GOAL = 2; // 2 minutes default
const DEFAULT_BRUSHING_FREQUENCY = 2; // 2 times a day default

interface BrushingGoalContextType {
  brushingGoalMinutes: number;
  setBrushingGoalMinutes: (minutes: number) => Promise<void>;
  brushingFrequency: number;
  setBrushingFrequency: (frequency: number) => Promise<void>;
  syncWithDatabase: (userId: string) => Promise<void>;
  debugCurrentState: () => void;
  isLoading: boolean;
}

const BrushingGoalContext = createContext<BrushingGoalContextType | undefined>(undefined);

interface BrushingGoalProviderProps {
  children: ReactNode;
}

export const BrushingGoalProvider: React.FC<BrushingGoalProviderProps> = ({ children }) => {
  const [brushingGoalMinutes, setBrushingGoalState] = useState<number>(DEFAULT_BRUSHING_GOAL);
  const [brushingFrequency, setBrushingFrequencyState] = useState<number>(DEFAULT_BRUSHING_FREQUENCY);
  const [isLoading, setIsLoading] = useState(true);

  // Load goals from storage on app start
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const storedGoal = await AsyncStorage.getItem(BRUSHING_GOAL_KEY);
        if (storedGoal !== null) {
          const goal = parseFloat(storedGoal);
          if (!isNaN(goal) && goal > 0) {
            setBrushingGoalState(goal);
          }
        }
        
        const storedFrequency = await AsyncStorage.getItem(BRUSHING_FREQUENCY_KEY);
        if (storedFrequency !== null) {
            const frequency = parseInt(storedFrequency, 10);
            if (!isNaN(frequency) && frequency > 0) {
                setBrushingFrequencyState(frequency);
            }
        }
      } catch (error) {
        console.error('Error loading brushing goals from storage:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadGoals();
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

  // Update brushing frequency and save to storage
  const setBrushingFrequency = async (frequency: number) => {
    try {
      if (frequency <= 0) {
        throw new Error('Brushing frequency must be positive');
      }

      setBrushingFrequencyState(frequency);
      await AsyncStorage.setItem(BRUSHING_FREQUENCY_KEY, frequency.toString());
    } catch (error) {
      console.error('Error saving brushing frequency:', error);
      throw error;
    }
  };


  // Sync brushing goal from database for authenticated users
  const syncWithDatabase = async (userId: string) => {
    console.log('🎯 Starting goal sync for userId:', userId);
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('target_time_in_sec, brushing_target')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user goals:', error);
        return;
      }
      
      if (data) {
        // Sync brushing time
        if (data.target_time_in_sec) {
          await setBrushingGoalMinutes(data.target_time_in_sec / 60);
        } else {
          // If null in DB, set it to default.
          await OnboardingService.updateBrushingTarget(userId, DEFAULT_BRUSHING_GOAL * 60);
          await setBrushingGoalMinutes(DEFAULT_BRUSHING_GOAL);
        }
        
        // Sync brushing frequency
        if (data.brushing_target) {
          await setBrushingFrequency(data.brushing_target);
        } else {
          // If null in DB, set it to default.
          await OnboardingService.updateBrushingFrequency(userId, DEFAULT_BRUSHING_FREQUENCY);
          await setBrushingFrequency(DEFAULT_BRUSHING_FREQUENCY);
        }
      }
    } catch (error) {
      console.error('💥 Error syncing brushing goals from database:', error);
    } finally {
        setIsLoading(false);
    }
  };

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log('🐛 CURRENT BRUSHING GOAL STATE:', {
      brushingGoalMinutes,
      brushingFrequency,
      isLoading,
      timestamp: new Date().toISOString()
    });
  };

  const value = {
    brushingGoalMinutes,
    setBrushingGoalMinutes,
    brushingFrequency,
    setBrushingFrequency,
    syncWithDatabase,
    debugCurrentState,
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