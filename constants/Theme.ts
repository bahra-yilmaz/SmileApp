import { Colors } from './Colors';
import { Platform, Dimensions } from 'react-native';
import { ThemeVariations, ThemeVariationKey } from './Colors';

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
    // Main text font (Quicksand)
    regular: 'Quicksand-Regular',
    medium: 'Quicksand-Medium',
    bold: 'Quicksand-Bold',
    light: 'Quicksand-Light',
    
    // Display/Title font (Merienda)
    displayRegular: 'Merienda-Regular',
    displayMedium: 'Merienda-Medium',
    displayBold: 'Merienda-Bold',
    displayLight: 'Merienda-Light',
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

// Responsive breakpoints
const breakpoints = {
  phone: 0,
  tablet: 768,
};

// Theme durations for animations and transitions
const durations = {
  fast: 250,
  normal: 350,
  slow: 500,
};

// Z-Index system for layering
const zIndex = {
  base: 0,
  card: 10,
  dialog: 20,
  navigation: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
};

// Layout constants
const layout = {
  screenWidth: width,
  screenHeight: height,
  maxContentWidth: 500, // max width for content in larger screens
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
  breakpoints,
  durations,
  zIndex,
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