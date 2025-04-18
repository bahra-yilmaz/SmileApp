import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';

export interface GlassmorphicCardProps extends ViewProps {
  /**
   * The intensity of the blur effect (0-100)
   * Higher values will create more pronounced blur
   */
  intensity?: number;
  
  /**
   * Additional styles for the card container
   */
  containerStyle?: StyleProp<ViewStyle>;
  
  /**
   * Whether to add a subtle border to the card
   */
  withBorder?: boolean;
  
  /**
   * The size of the border radius
   */
  borderRadius?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'pill';
  
  /**
   * The shadow size to apply to the card
   */
  shadow?: 'none' | 'sm' | 'md' | 'lg';

  /**
   * Card variant - 'default' for regular cards, 'input' for form fields
   */
  variant?: 'default' | 'input';
  
  /**
   * Optional width override (number for exact width or string for percentages)
   */
  width?: DimensionValue;
}

/**
 * A glassmorphic card component with blur effect background
 */
export function GlassmorphicCard({
  intensity = 50,
  containerStyle,
  withBorder = true,
  borderRadius = 'md',
  shadow = 'md',
  variant = 'default',
  width = 260,
  style,
  children,
  ...props
}: GlassmorphicCardProps) {
  const { theme } = useTheme();
  const { colors, borderRadius: themeRadius } = theme;
  const colorScheme = theme.colorScheme;
  
  // Get the glass configuration for the current theme
  const glass = colors.glass[colorScheme];
  
  // Determine the border radius value
  const borderRadiusValue = borderRadius === 'none' 
    ? 0 
    : themeRadius[borderRadius];
  
  // Get shadow style
  const shadowStyle = shadow !== 'none' 
    ? colors.shadows[colorScheme][shadow] 
    : {};
  
  // Determine background and border color based on variant
  const backgroundColor = variant === 'input' 
    ? glass.inputBackground 
    : glass.background;
  
  const borderColor = variant === 'input'
    ? glass.inputBorder
    : glass.border;
  
  // Adjust intensity for input variant for better text contrast
  const adjustedIntensity = variant === 'input' ? intensity * 0.8 : intensity;
  
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: borderRadiusValue,
          width: width,
        },
        shadowStyle,
        containerStyle,
      ]}
      {...props}
    >
      <BlurView
        intensity={adjustedIntensity}
        tint={colorScheme}
        style={[
          styles.blurView,
          {
            borderRadius: borderRadiusValue,
            borderWidth: withBorder ? StyleSheet.hairlineWidth : 0,
            borderColor: borderColor,
            backgroundColor: backgroundColor,
            width: width,
          },
          style,
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  blurView: {
    overflow: 'hidden',
  },
});

export default GlassmorphicCard; 