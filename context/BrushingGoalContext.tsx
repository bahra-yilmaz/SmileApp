import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';

const BRUSHING_GOAL_KEY = 'brushing_time_goal';
const DEFAULT_BRUSHING_GOAL = 2; // 2 minutes default

interface BrushingGoalContextType {
  brushingGoalMinutes: number;
  setBrushingGoalMinutes: (minutes: number) => Promise<void>;
  syncBrushingGoalFromDatabase: (userId: string) => Promise<void>;
  debugCurrentState: () => void;
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

  // Sync brushing goal from database for authenticated users
  const syncBrushingGoalFromDatabase = async (userId: string) => {
    console.log('🎯 Starting sync for userId:', userId);
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('target_time_in_sec')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single()

      console.log('📊 Database response:', { userData, error });

      if (error) {
        console.error('❌ Error fetching user target time:', error);
        return;
      }

      // If user record exists and has target_time_in_sec, use it
      if (userData?.target_time_in_sec) {
        const goalInMinutes = userData.target_time_in_sec / 60;
        console.log('✅ Found existing target:', userData.target_time_in_sec, 'sec =', goalInMinutes, 'min');
        setBrushingGoalState(goalInMinutes);
        await AsyncStorage.setItem(BRUSHING_GOAL_KEY, goalInMinutes.toString());
        console.log('💾 Updated local state and storage');
      } else if (userData) {
        // User record exists but target_time_in_sec is null, update it to default
        console.log('🔄 User exists but target_time_in_sec is null, updating to default...');
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ target_time_in_sec: 120 })
          .eq('id', userId);

        console.log('🔄 Update result:', { updateError });

        if (!updateError) {
          const goalInMinutes = 120 / 60; // 2 minutes
          console.log('✅ Set default target: 120 sec = 2 min');
          setBrushingGoalState(goalInMinutes);
          await AsyncStorage.setItem(BRUSHING_GOAL_KEY, goalInMinutes.toString());
          console.log('💾 Updated local state and storage with default');
        }
      } else {
        // User doesn't exist - this shouldn't happen for authenticated users
        // For authenticated users, the user record should exist from signup/onboarding
        console.warn('⚠️ Authenticated user not found in database. Using current local value.');
        // Keep the current local value, don't try to create a duplicate record
      }
    } catch (error) {
      console.error('💥 Error syncing brushing goal from database:', error);
    }
  };

  // Debug function to check current state
  const debugCurrentState = () => {
    console.log('🐛 CURRENT BRUSHING GOAL STATE:', {
      brushingGoalMinutes,
      isLoading,
      timestamp: new Date().toISOString()
    });
  };

  const value = {
    brushingGoalMinutes,
    setBrushingGoalMinutes,
    syncBrushingGoalFromDatabase,
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