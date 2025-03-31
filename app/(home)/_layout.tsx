import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';
import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

export default function HomeLayout() {
  const { theme, colorScheme } = useTheme();
  const { colors } = theme;
  
  return (
    <Stack
      screenOptions={{
        headerTransparent: true,
        headerBackground: () => (
          <BlurView 
            intensity={80} 
            tint={colorScheme}
            style={StyleSheet.absoluteFill}
          />
        ),
        headerTintColor: theme.activeColors.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: 'transparent', 
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Smile App',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false, // We handle our own header in the settings screen
        }}
      />
    </Stack>
  );
} 