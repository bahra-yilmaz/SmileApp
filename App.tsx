import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
// import './app/i18n'; // Remove potentially conflicting old i18n setup
import './services/i18n'; // Our new i18n setup

export default function App() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(home)" />
      </Stack>
    </SafeAreaProvider>
  );
} 