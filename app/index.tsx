import React, { useEffect, useState, useRef } from 'react';
import { Redirect } from 'expo-router';
import { OnboardingService } from '../services/OnboardingService';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { hideAsync } from 'expo-splash-screen';

export default function RootScreen() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { user, isLoading } = useAuth();
  const hasRedirected = useRef(false);
  
  useEffect(() => {
    if (!isLoading) {
      console.log('🔍 RootScreen: Auth loaded, checking onboarding status...', { userId: user?.id });
      checkOnboardingStatus();
    }
  }, [isLoading, user]);
  
  const checkOnboardingStatus = async () => {
    try {
      console.log('🔍 RootScreen: Checking onboarding completion for user:', user?.id);
      const completed = await OnboardingService.hasCompletedOnboardingEnhanced(user?.id);
      console.log('🔍 RootScreen: Onboarding completed:', completed);
      setOnboardingCompleted(completed);
    } catch (error) {
      console.error('❌ Error checking onboarding status:', error);
      // Default to showing onboarding if there's an error
      setOnboardingCompleted(false);
    } finally {
      // Hide splash screen now that we are ready to navigate
      await hideAsync();
    }
  };
  
  // While we are checking, the splash screen is visible. We return a blank view.
  if (onboardingCompleted === null || isLoading) {
    return <View style={styles.container} />;
  }
  
  // Once loading is complete, we decide where to redirect.
  const redirectTo = onboardingCompleted ? "/(home)" : "/onboarding/language-select";
  
  // Only log the redirection once to avoid noise from re-renders.
  if (!hasRedirected.current) {
    console.log('🔍 RootScreen: Redirecting...', { 
      onboardingCompleted, 
      redirectTo
    });
    hasRedirected.current = true;
  }
  
  // Consistently render the Redirect component to ensure navigation occurs.
  return <Redirect href={redirectTo} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 