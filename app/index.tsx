import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { OnboardingService } from '../services/OnboardingService';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RootScreen() {
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
    checkOnboardingStatus();
    }
  }, [isLoading, user]);
  
  const checkOnboardingStatus = async () => {
    try {
      const completed = await OnboardingService.hasCompletedOnboarding(user?.id);
      setOnboardingCompleted(completed);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to showing onboarding if there's an error
      setOnboardingCompleted(false);
    }
  };
  
  // Don't render anything until we know the onboarding status or auth still loading
  if (onboardingCompleted === null || isLoading) {
    return <View style={styles.container} />;
  }
  
  return (
    <View style={styles.container}>
      <Redirect href={onboardingCompleted ? "/(home)" : "/onboarding/language-select"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 