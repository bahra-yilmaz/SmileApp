import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { 
  BrushingGoalsService, 
  BrushingGoals, 
  DEFAULT_VALUES,
  BrushingTimeOption,
  BrushingFrequencyOption 
} from '../services/BrushingGoalsService';

interface BrushingGoalContextType {
  // Current values
  brushingGoalMinutes: number;
  brushingFrequency: number;
  
  // Update methods
  setBrushingGoalMinutes: (minutes: number, options?: { userId?: string; source?: 'user' | 'database' | 'onboarding' }) => Promise<void>;
  setBrushingFrequency: (frequency: number, options?: { userId?: string; source?: 'user' | 'database' | 'onboarding' }) => Promise<void>;
  
  // Sync and utility methods
  syncWithDatabase: (userId: string) => Promise<void>;
  getCurrentGoals: () => Promise<BrushingGoals>;
  
  // Convenience methods for options
  getCurrentTimeTargetOption: () => BrushingTimeOption | null;
  getCurrentFrequencyOption: () => BrushingFrequencyOption | null;
  
  // State
  isLoading: boolean;
  lastSyncTimestamp?: number;
  
  // Debug (keeping for backward compatibility)
  debugCurrentState: () => void;
}

interface BrushingGoalProviderProps {
  children: ReactNode;
}

const BrushingGoalContext = createContext<BrushingGoalContextType | undefined>(undefined);

export const BrushingGoalProvider: React.FC<BrushingGoalProviderProps> = ({ children }) => {
  const [brushingGoalMinutes, setBrushingGoalState] = useState<number>(DEFAULT_VALUES.BRUSHING_TIME_MINUTES);
  const [brushingFrequency, setBrushingFrequencyState] = useState<number>(DEFAULT_VALUES.BRUSHING_FREQUENCY);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number | undefined>();

  // Initialize and load goals on app start
  useEffect(() => {
    const initializeGoals = async () => {
      try {
        setIsLoading(true);
        const goals = await BrushingGoalsService.initialize();
        setBrushingGoalState(goals.timeTargetMinutes);
        setBrushingFrequencyState(goals.dailyFrequency);
        setLastSyncTimestamp(goals.lastSyncTimestamp);
      } catch (error) {
        console.error('Error initializing brushing goals in context:', error);
        // Fall back to defaults
        setBrushingGoalState(DEFAULT_VALUES.BRUSHING_TIME_MINUTES);
        setBrushingFrequencyState(DEFAULT_VALUES.BRUSHING_FREQUENCY);
      } finally {
        setIsLoading(false);
      }
    };

    initializeGoals();

    // Subscribe to service events to keep context in sync
    const unsubscribeTimeTarget = BrushingGoalsService.on('time-target-changed', (data: any) => {
      setBrushingGoalState(data.timeTargetMinutes);
    });

    const unsubscribeFrequency = BrushingGoalsService.on('frequency-changed', (data: any) => {
      setBrushingFrequencyState(data.dailyFrequency);
    });

    const unsubscribeSync = BrushingGoalsService.on('goals-synced', (goals: BrushingGoals) => {
      setBrushingGoalState(goals.timeTargetMinutes);
      setBrushingFrequencyState(goals.dailyFrequency);
      setLastSyncTimestamp(goals.lastSyncTimestamp);
    });

    return () => {
      unsubscribeTimeTarget();
      unsubscribeFrequency();
      unsubscribeSync();
    };
  }, []);

  // Update brushing goal and save to storage/database
  const setBrushingGoalMinutes = async (
    minutes: number, 
    options: { userId?: string; source?: 'user' | 'database' | 'onboarding' } = {}
  ) => {
    try {
      await BrushingGoalsService.updateTimeTarget(minutes, {
        userId: options.userId,
        syncToDatabase: true,
        source: options.source || 'user'
      });
      // State will be updated via event subscription
    } catch (error) {
      console.error('Error saving brushing goal:', error);
      throw error;
    }
  };

  // Update brushing frequency and save to storage/database
  const setBrushingFrequency = async (
    frequency: number, 
    options: { userId?: string; source?: 'user' | 'database' | 'onboarding' } = {}
  ) => {
    try {
      await BrushingGoalsService.updateFrequency(frequency, {
        userId: options.userId,
        syncToDatabase: true,
        source: options.source || 'user'
      });
      // State will be updated via event subscription
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
      const goals = await BrushingGoalsService.syncFromDatabase(userId);
      // State will be updated via event subscription
      console.log('✅ Goals synced successfully:', goals);
    } catch (error) {
      console.error('💥 Error syncing brushing goals from database:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current goals
  const getCurrentGoals = async (): Promise<BrushingGoals> => {
    return await BrushingGoalsService.getCurrentGoals();
  };

  // Get current time target option
  const getCurrentTimeTargetOption = (): BrushingTimeOption | null => {
    return BrushingGoalsService.getTimeTargetOption(brushingGoalMinutes);
  };

  // Get current frequency option
  const getCurrentFrequencyOption = (): BrushingFrequencyOption | null => {
    return BrushingGoalsService.getFrequencyOption(brushingFrequency);
  };

  // Debug current state (keeping for backward compatibility)
  const debugCurrentState = () => {
    BrushingGoalsService.debugCurrentState();
  };

  const value: BrushingGoalContextType = {
    // Current values
    brushingGoalMinutes,
    brushingFrequency,
    
    // Update methods
    setBrushingGoalMinutes,
    setBrushingFrequency,
    
    // Sync and utility methods
    syncWithDatabase,
    getCurrentGoals,
    
    // Convenience methods
    getCurrentTimeTargetOption,
    getCurrentFrequencyOption,
    
    // State
    isLoading,
    lastSyncTimestamp,
    
    // Debug
    debugCurrentState,
  };

  return (
    <BrushingGoalContext.Provider value={value}>
      {children}
    </BrushingGoalContext.Provider>
  );
};

export const useBrushingGoal = (): BrushingGoalContextType => {
  const context = useContext(BrushingGoalContext);
  if (context === undefined) {
    throw new Error('useBrushingGoal must be used within a BrushingGoalProvider');
  }
  return context;
}; 