import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageSelectScreen } from '../screens/onboarding/LanguageSelectScreen';

export type RootStackParamList = {
  Onboarding: undefined;
  LanguageSelect: undefined;
  // Add other screens here
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="LanguageSelect"
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen 
          name="LanguageSelect" 
          component={LanguageSelectScreen} 
        />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 