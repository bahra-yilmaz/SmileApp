import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';
import { Platform } from 'react-native';

export default function OnboardingLayout() {
  const { theme } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 200,
        contentStyle: { backgroundColor: 'transparent' },
        presentation: 'transparentModal',
      }}
    >
      <Stack.Screen
        name="signup"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen
        name="signin"
        options={{
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }}
      />
      <Stack.Screen name="index" />
      <Stack.Screen name="features" />
      <Stack.Screen name="personalize" />
    </Stack>
  );
} 