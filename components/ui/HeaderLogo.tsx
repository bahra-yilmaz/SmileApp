import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface HeaderLogoProps {
  /**
   * Optional additional padding to add to the top
   */
  additionalTopPadding?: number;

  /**
   * Whether to show a back chevron (default true)
   */
  showBackButton?: boolean;
}

/**
 * A consistent header logo component used across authentication screens
 */
export function HeaderLogo({ additionalTopPadding = 10, showBackButton = false }: HeaderLogoProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [fontsLoaded] = useFonts({
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  const fontFamily = fontsLoaded ? 'Merienda-Medium' : 'System';
  
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/settings');
  };
  
  return (
    <View style={[styles.header, { paddingTop: insets.top + additionalTopPadding }]}>
      {showBackButton ? (
        <Pressable onPress={handleBack} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={32} color="white" />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      <Text style={[styles.headerText, { fontFamily }]}>smile</Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    paddingVertical: 16, // Add vertical padding to ensure text is fully visible
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 32,
    color: 'white',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
});

export default HeaderLogo; 