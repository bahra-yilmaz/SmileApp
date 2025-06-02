import Colors from '../../constants/Colors';
import { Platform, Dimensions } from 'react-native';
import { ThemeVariations, type ThemeVariationKey } from '../../constants/Colors';

const { width, height } = Dimensions.get('window');

// Spacing system - used for margins, paddings, gaps
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius system
const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 9999,
  circle: 9999,
};

// Typography system
const typography = {
  fonts: {
    // Main text font
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
    medium: Platform.select({
      ios: 'System',
      android: 'Roboto-Medium',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto-Bold',
    }),
    light: Platform.select({
      ios: 'System',
      android: 'Roboto-Light',
    }),
  },
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
    title: 32,
  },
  weights: {
    thin: '100',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '900',
  },
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 32,
    xxl: 36,
    xxxl: 48,
  },
};

// Layout constants
const layout = {
  screenWidth: width,
  screenHeight: height,
  maxContentWidth: 500,
  windowWidth: width,
  windowHeight: height,
  isSmallDevice: width < 375,
};

// Helper functions
const hitSlop = (size = spacing.md) => ({
  top: size,
  left: size,
  right: size,
  bottom: size,
});

// Main theme export
export const Theme = {
  colors: Colors,
  spacing,
  borderRadius,
  typography,
  layout,
  hitSlop,
};

// Type definitions
export type ThemeType = typeof Theme;
export type ColorScheme = 'light' | 'dark';
export type ThemeVariation = ThemeVariationKey;

// Extended Theme type with active color scheme and theme variation
export interface ActiveThemeType extends ThemeType {
  colorScheme: ColorScheme;
  themeVariation: ThemeVariation;
  activeColors: typeof Colors.light | typeof Colors.dark;
}

// Helper function to get the theme for a specific color scheme and variation
export const getTheme = (
  colorScheme: ColorScheme, 
  themeVariation: ThemeVariation = 'default'
): ActiveThemeType => {
  const variation = ThemeVariations[themeVariation];
  
  // Create a customized colors object with the selected variation
  const customColors = {
    ...Colors,
    primary: variation.primary,
    accent: variation.accent,
  };
  
  return {
    ...Theme,
    colors: customColors,
    colorScheme,
    themeVariation,
    activeColors: customColors[colorScheme],
  };
}; 