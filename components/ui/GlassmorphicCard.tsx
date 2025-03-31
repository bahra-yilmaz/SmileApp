import React from 'react';
import { View, StyleSheet, ViewProps, StyleProp, ViewStyle } from 'react-native';
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
  
  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: borderRadiusValue,
        },
        shadowStyle,
        containerStyle,
      ]}
      {...props}
    >
      <BlurView
        intensity={intensity}
        tint={colorScheme}
        style={[
          styles.blurView,
          {
            borderRadius: borderRadiusValue,
            borderWidth: withBorder ? StyleSheet.hairlineWidth : 0,
            borderColor: glass.border,
            backgroundColor: glass.background,
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