import React from 'react';
import { View, type ViewProps, ViewStyle } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTheme } from './ThemeProvider';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'card' | 'glass' | 'bordered';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'default',
  shadow = 'none',
  ...otherProps 
}: ThemedViewProps) {
  const { theme } = useTheme();
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const { colors, borderRadius } = theme;
  const colorScheme = theme.colorScheme;

  // Define variant styles
  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'card':
        return {
          backgroundColor: theme.activeColors.card,
          borderRadius: borderRadius.md,
        };
      case 'glass':
        return {
          backgroundColor: colors.glass[colorScheme].background,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: colors.glass[colorScheme].border,
        };
      case 'bordered':
        return {
          backgroundColor,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: theme.activeColors.border,
        };
      case 'default':
      default:
        return {
          backgroundColor,
        };
    }
  })();

  // Shadow style
  const shadowStyle: ViewStyle = shadow !== 'none' ? 
    colors.shadows[colorScheme][shadow] : {};

  return (
    <View 
      style={[
        variantStyle, 
        shadowStyle,
        style
      ]} 
      {...otherProps} 
    />
  );
}

export default ThemedView;
