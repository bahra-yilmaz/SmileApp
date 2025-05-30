import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../components/ThemeProvider';
import { Platform, View, StyleSheet } from 'react-native';
import HeaderLogo from '../../components/ui/HeaderLogo';

export default function OnboardingLayout() {
  const { theme } = useTheme();
  
  return (
    <View style={styles.container}>
      {/* Fixed HeaderLogo that stays visible during transitions */}
      <HeaderLogo additionalTopPadding={Platform.OS === 'ios' ? 10 : 15} />
      
      <Stack
        id="onboarding"
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
          presentation: 'card',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen
          name="language-select"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="signin"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="index"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="features"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="personalize"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="toothbrush"
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="nubo-tone"
          options={{
            gestureEnabled: false,
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 