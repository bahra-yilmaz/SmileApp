import React from 'react';
import { Pressable, PressableProps, Platform } from 'react-native';
import * as Linking from 'expo-linking';

interface CustomNavigatorProps extends PressableProps {
  route: string;
  children: React.ReactNode;
}

export default function CustomNavigator({ route, children, ...rest }: CustomNavigatorProps) {
  const handlePress = () => {
    // This works on both web and native
    Linking.openURL(Linking.createURL(route));
  };
  
  return (
    <Pressable {...rest} onPress={handlePress}>
      {children}
    </Pressable>
  );
} 