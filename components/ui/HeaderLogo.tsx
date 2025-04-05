import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';

interface HeaderLogoProps {
  /**
   * Optional additional padding to add to the top
   */
  additionalTopPadding?: number;
}

/**
 * A consistent header logo component used across authentication screens
 */
export function HeaderLogo({ additionalTopPadding = 10 }: HeaderLogoProps) {
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  const fontFamily = fontsLoaded ? 'Merienda-Medium' : 'System';
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + additionalTopPadding }]}>
      <Text style={[styles.headerText, { fontFamily }]}>smile</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    paddingVertical: 16, // Add vertical padding to ensure text is fully visible
  },
  headerText: {
    fontSize: 32,
    color: 'white',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
});

export default HeaderLogo; 