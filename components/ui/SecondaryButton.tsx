import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, TextStyle, View, ActivityIndicator } from 'react-native';
import ThemedText from '../ThemedText';
import { useTheme } from '../ThemeProvider';
import { useFonts } from 'expo-font';

interface SecondaryButtonProps {
  /**
   * Button text content
   */
  label: string;
  
  /**
   * Function to call when button is pressed
   */
  onPress: () => void;
  
  /**
   * Optional additional styles for the button container
   */
  style?: ViewStyle;
  
  /**
   * Optional additional styles for the text
   */
  textStyle?: TextStyle;
  
  /**
   * Whether to use the display font (Merienda) for the button text
   */
  useDisplayFont?: boolean;
  
  /**
   * Whether the button is in a disabled state
   */
  disabled?: boolean;

  /**
   * Optional width override
   */
  width?: number;
  
  /**
   * Whether the button is in loading state
   */
  isLoading?: boolean;
}

/**
 * A secondary action button component that follows the app's design system.
 * Features a transparent background with white stroke/border.
 */
export default function SecondaryButton({
  label,
  onPress,
  style,
  textStyle,
  useDisplayFont = false,
  disabled = false,
  width = 260,
  isLoading = false,
}: SecondaryButtonProps) {
  const { theme } = useTheme();
  
  // Load fonts explicitly in the component
  const [fontsLoaded] = useFonts({
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  // Secondary button style with transparent background and white border
  const buttonStyle = {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'white',
    opacity: disabled ? 0.7 : 1,
  };
  
  return (
    <View style={[
      styles.shadowContainer,
      { width: width },
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || isLoading}
        style={[
          styles.button,
          { width: width, borderRadius: 30 },
          buttonStyle,
        ]}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <ThemedText 
            style={[
              styles.buttonText,
              { color: 'white' },
              // Apply display font only if it's loaded and requested
              useDisplayFont && fontsLoaded ? { fontFamily: 'Merienda-Medium' } : {},
              textStyle,
            ]}
            // Don't pass the useDisplayFont prop to ThemedText if we're handling it here
            weight={useDisplayFont && fontsLoaded ? 'medium' : 'bold'}
          >
            {label}
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    borderRadius: 30,
    marginVertical: 6,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    overflow: 'hidden',
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    flexShrink: 1,
  },
}); 