import React from 'react';
import { Stack } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import HeaderLogo from '../../components/ui/HeaderLogo';
import { usePathname } from 'expo-router';
import { OnboardingProvider } from '../../context/OnboardingContext'; // 1. Import OnboardingProvider

export default function OnboardingLayout() {
  const pathname = usePathname();
  const showBackButton = !!(pathname && (pathname.endsWith('/signin') || pathname.endsWith('/signup')));
  
  return (
    <View style={styles.container}>
      {/* Fixed HeaderLogo that stays visible during transitions */}
      <HeaderLogo 
        additionalTopPadding={Platform.OS === 'ios' ? 10 : 15} 
        showBackButton={showBackButton}
      />
        {/* 2. Wrap the Stack with OnboardingProvider */}
      <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
          contentStyle: { backgroundColor: 'transparent' },
          presentation: 'card',
          gestureEnabled: false,
        }}
      >
        {/* 3. Add the screens */}
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
      </OnboardingProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 