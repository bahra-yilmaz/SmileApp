import React from 'react';
import { Text, type TextProps, StyleSheet, TextStyle } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTheme } from './ThemeProvider';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'default' | 'title' | 'subtitle' | 'body' | 'caption' | 'button' | 'link' | 'display';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold' | 'light';
  useDisplayFont?: boolean;
};

export default function ThemedText({
  style,
  lightColor,
  darkColor,
  variant = 'default',
  weight = 'regular',
  useDisplayFont = false,
  ...rest
}: ThemedTextProps) {
  const { theme } = useTheme();
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { typography } = theme;

  // Determine if this variant should use the display font by default
  const shouldUseDisplayFont = useDisplayFont || 
    variant === 'title' || 
    variant === 'display' || 
    variant === 'subtitle';

  // Define the font styles based on variant
  const variantStyle: TextStyle = (() => {
    switch (variant) {
      case 'display':
        return {
          fontSize: typography.sizes.display,
          lineHeight: typography.lineHeights.xxxl,
          fontFamily: typography.fonts[shouldUseDisplayFont ? 'displayBold' : 'bold'],
        };
      case 'title':
        return {
          fontSize: typography.sizes.title,
          lineHeight: typography.lineHeights.xxl,
          fontFamily: typography.fonts[shouldUseDisplayFont ? 'displayMedium' : 'bold'],
        };
      case 'subtitle':
        return {
          fontSize: typography.sizes.xl,
          lineHeight: typography.lineHeights.xl,
          fontFamily: typography.fonts[shouldUseDisplayFont ? 'displayRegular' : 'medium'],
        };
      case 'body':
        return {
          fontSize: typography.sizes.md,
          lineHeight: typography.lineHeights.md,
          fontFamily: typography.fonts.regular,
        };
      case 'caption':
        return {
          fontSize: typography.sizes.sm,
          lineHeight: typography.lineHeights.sm,
          fontFamily: typography.fonts.regular,
        };
      case 'button':
        return {
          fontSize: typography.sizes.md,
          lineHeight: typography.lineHeights.md,
          fontFamily: typography.fonts.medium,
        };
      case 'link':
        return {
          fontSize: typography.sizes.md,
          lineHeight: typography.lineHeights.md,
          fontFamily: typography.fonts.regular,
          color: theme.colors.primary[500],
          textDecorationLine: 'underline' as const,
        };
      case 'default':
      default:
        return {
          fontSize: typography.sizes.md,
          lineHeight: typography.lineHeights.md,
          fontFamily: typography.fonts.regular,
        };
    }
  })();

  // Font weight (applies only when not using display font, as display font has its own weights)
  const getFontWeight = (): TextStyle['fontWeight'] => {
    if (shouldUseDisplayFont) {
      return undefined; // Don't set fontWeight when using a specific display font family
    }
    
    switch (weight) {
      case 'medium':
        return '500';
      case 'semibold':
        return '600';
      case 'bold':
        return 'bold';
      case 'light':
        return '300';
      case 'regular':
      default:
        return 'normal';
    }
  };

  // Get the correct font family based on weight and display font preference
  const getFontFamily = (): string => {
    if (shouldUseDisplayFont) {
      switch (weight) {
        case 'bold':
          return typography.fonts.displayBold;
        case 'medium':
          return typography.fonts.displayMedium;
        case 'light':
          return typography.fonts.displayLight;
        case 'regular':
        default:
          return typography.fonts.displayRegular;
      }
    } else {
      switch (weight) {
        case 'bold':
          return typography.fonts.bold;
        case 'medium':
          return typography.fonts.medium;
        case 'light':
          return typography.fonts.light;
        case 'regular':
        default:
          return typography.fonts.regular;
      }
    }
  };

  // Final text style including font family
  const textStyle: TextStyle = {
    ...variantStyle,
    fontFamily: getFontFamily(),
    fontWeight: getFontWeight(),
    color,
  };

  return (
    <Text
      style={[
        textStyle,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
