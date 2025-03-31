import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';

export default function OnboardingLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: 'transparent',
        },
        animation: 'slide_from_right',
      }}
    />
  );
} 