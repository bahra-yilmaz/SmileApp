import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle, TextStyle, View } from 'react-native';
import ThemedText from '../ThemedText';
import GlassmorphicCard from './GlassmorphicCard';
import { useTheme } from '../ThemeProvider';

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
   * Button variant (filled is solid, glass is glassmorphic)
   */
  variant?: 'filled' | 'glass';
  
  /**
   * The intensity of the blur effect (0-100) when using glass variant
   */
  intensity?: number;
  
  /**
   * Whether the button is in a disabled state
   */
  disabled?: boolean;

  /**
   * Optional width override
   */
  width?: number;
}

/**
 * A primary action button component that follows the app's design system
 */
export default function PrimaryButton({
  label,
  onPress,
  style,
  textStyle,
  useDisplayFont = false,
  variant = 'filled',
  intensity = 90,
  disabled = false,
  width = 260,
}: PrimaryButtonProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  
  const isGlass = variant === 'glass';
  
  // Styles for filled variant
  const filledButtonStyle = {
    backgroundColor: isGlass ? 'rgba(255, 255, 255, 0.9)' : colors.primary[500],
    opacity: disabled ? 0.7 : 1,
  };
  
  // Text color based on variant
  const textColor = isGlass ? colors.neutral[800] : 'white';
  
  if (isGlass) {
    return (
      <GlassmorphicCard
        style={[
          styles.button,
          { width: width, borderRadius: 25 },
          filledButtonStyle,
          style,
        ]}
        intensity={intensity}
        shadow="none"
        withBorder={false}
      >
        <TouchableOpacity
          onPress={onPress}
          disabled={disabled}
          style={styles.touchable}
        >
          <ThemedText 
            style={[
              styles.buttonText,
              { color: textColor },
              useDisplayFont ? { fontFamily: 'Merienda-Medium' } : {},
              textStyle,
            ]}
            useDisplayFont={useDisplayFont}
            weight={useDisplayFont ? 'medium' : 'bold'}
          >
            {label}
          </ThemedText>
        </TouchableOpacity>
      </GlassmorphicCard>
    );
  }
  
  // Default filled button
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        { width: width, borderRadius: 25 },
        filledButtonStyle,
        style,
      ]}
    >
      <ThemedText 
        style={[
          styles.buttonText,
          { color: textColor },
          useDisplayFont ? { fontFamily: 'Merienda-Medium' } : {},
          textStyle,
        ]}
        useDisplayFont={useDisplayFont}
        weight={useDisplayFont ? 'medium' : 'bold'}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 55,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  touchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 8,
    flexShrink: 1,
  },
}); 