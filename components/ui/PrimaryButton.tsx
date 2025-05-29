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
  
  const flatParentStyle = StyleSheet.flatten(style || {});

  // Determine background and border for the TouchableOpacity
  const touchableOpacityBackgroundColor = 
    flatParentStyle.backgroundColor !== undefined 
    ? flatParentStyle.backgroundColor 
    : 'rgba(255, 255, 255, 0.9)'; // Default primary button background

  // If a custom background is provided, remove the default border.
  const touchableOpacityBorderWidth = flatParentStyle.backgroundColor !== undefined ? 0 : 1;
  // Keep default border color, only used if borderWidth is > 0
  const touchableOpacityBorderColor = 'rgba(255, 255, 255, 0.9)'; 

  // Styles for the TouchableOpacity itself
  const touchableOpacitySpecificStyles: ViewStyle = {
    backgroundColor: touchableOpacityBackgroundColor,
    borderWidth: touchableOpacityBorderWidth,
    borderColor: touchableOpacityBorderColor,
    opacity: !isClickable ? 0.7 : 1,
  };
  
  // Determine borderRadius for the Animated.View (shadowContainer) and TouchableOpacity
  const finalBorderRadius = typeof flatParentStyle.borderRadius === 'number' 
    ? flatParentStyle.borderRadius 
    : 30; // Default PrimaryButton borderRadius

  // The style for Animated.View (wrapper) will take all styles from flatParentStyle.
  // This includes properties like shadowOpacity and elevation, which will override defaults 
  // from styles.shadowContainer if provided.
  // The backgroundColor from flatParentStyle will apply to the Animated.View,
  // and touchableOpacityBackgroundColor will apply to the TouchableOpacity on top.

  return (
    <Animated.View style={[
      styles.shadowContainer, // Default shadow styles (excluding borderRadius)
      { width: width },      // Default width for shadow container
      transformStyle,         // Animation transform
      shadowStyle,            // Animation shadow from hook
      flatParentStyle,        // Parent-provided styles (e.g., shadowOpacity:0, elevation:0, and BG for wrapper)
      { borderRadius: finalBorderRadius }, // Apply finalBorderRadius to the shadow container
    ]}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!isClickable}
        style={[
          styles.button, // Base layout (padding, alignment, excluding borderRadius)
          { 
            width: width, 
            borderRadius: finalBorderRadius // Use the determined borderRadius for the touchable area
          }, 
          touchableOpacitySpecificStyles, // Calculated BG, border, opacity for the touchable surface
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
    marginVertical: 6,
  },
  button: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    overflow: 'hidden',
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