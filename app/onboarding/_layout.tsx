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
    >
      <Stack.Screen name="signup" />
      <Stack.Screen name="index" />
      <Stack.Screen name="features" />
      <Stack.Screen name="personalize" />
    </Stack>
  );
} 