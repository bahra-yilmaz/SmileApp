import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of the onboarding data
// We use 'any' for now to allow for partial updates, but will tighten this later.
interface OnboardingData {
  age_group?: number;
  brushing_target?: number;
  toothbrush_start_date?: string | null;
  mascot_tone?: string;
}

// Define the shape of the context's value
interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboardingData: () => void;
}

// Create the context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// Define the initial state for our data
const initialState: OnboardingData = {
  age_group: undefined,
  brushing_target: 2, // Defaulting to a sensible value
  toothbrush_start_date: undefined,
  mascot_tone: 'supportive', // Defaulting to a sensible value
};

// Create the provider component
interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [onboardingData, setOnboardingData] = useState<OnboardingData>(initialState);

  // Function to update parts of the onboarding data
  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prevData => ({ ...prevData, ...data }));
  };

  // Function to reset the data
  const resetOnboardingData = () => {
    setOnboardingData(initialState);
  };

  const value = {
    onboardingData,
    updateOnboardingData,
    resetOnboardingData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};