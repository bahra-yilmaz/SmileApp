import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, TextStyle, ActivityIndicator, Animated } from 'react-native';
import ThemedText from '../ThemedText';
import { useTheme } from '../ThemeProvider';
import { useFonts } from 'expo-font';
import { Colors } from '../../constants/Colors';
import { useButtonPulseAnimation } from '../../hooks/useButtonPulseAnimation';

interface PrimaryButtonProps {
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
 * A primary action button component that follows the app's design system.
 * Features a solid background with a subtle shadow.
 */
export default function PrimaryButton({
  label,
  onPress,
  style,
  textStyle,
  useDisplayFont = false,
  disabled = false,
  width = 260,
  isLoading = false,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  
  const [fontsLoaded] = useFonts({
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });

  const isClickable = !disabled && !isLoading;
  const { transformStyle, shadowStyle } = useButtonPulseAnimation(isClickable);
  
  const buttonStyle = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    opacity: !isClickable ? 0.7 : 1,
  };
  
  return (
    <Animated.View style={[
      styles.shadowContainer,
      { width: width },
      transformStyle,
      shadowStyle,
      style,
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!isClickable}
        style={[
          styles.button,
          { width: width, borderRadius: 30 },
          buttonStyle,
        ]}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        ) : (
          <ThemedText 
            style={[
              styles.buttonText,
              { color: Colors.primary[500] },
              useDisplayFont && fontsLoaded ? { fontFamily: 'Merienda-Medium' } : {},
              textStyle,
            ]}
            weight={useDisplayFont && fontsLoaded ? 'medium' : 'bold'}
          >
            {label}
          </ThemedText>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
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
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    paddingVertical: 0,
    flexShrink: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
}); 