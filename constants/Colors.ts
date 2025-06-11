/**
 * Theme system for the Smile App with support for light and dark modes.
 * These colors are carefully selected to work well with glassmorphism effects and modern UI patterns.
 * All components should consume these values for consistent styling across the app.
 */

// Primary palette
const primary = {
  50:  '#E7F1FA',
  100: '#C5DCF1',
  200: '#A2C6E7',
  300: '#7FB0DD',
  400: '#5D9AD4',
  500: '#386495', // Navy blue main color
  600: '#325882',
  700: '#2B4C6F',
  800: '#24405C',
  900: '#1D3449',
};

// Accent palette - used for highlights and call-to-actions
const accent = {
  50: '#FFF0F8',
  100: '#FFCCE8',
  200: '#FFA3D9',
  300: '#FF7AC9',
  400: '#FF52BA',
  500: '#FF29AA', // Main accent color
  600: '#E6219A',
  700: '#CC1A8B',
  800: '#B3137B',
  900: '#990D6C',
};

// Neutral palette - for text, backgrounds, and UI elements
const neutral = {
  50: '#F7F9FA',
  100: '#E8ECEF',
  200: '#D9DFE3',
  300: '#C7CDD3',
  400: '#A9B2B9',
  500: '#8B969F', // Base neutral
  600: '#6D7A85',
  700: '#535F6A',
  800: '#3A444E',
  900: '#1F2933',
};

// Success, warning, error, and info colors
const feedback = {
  success: {
    light: '#22C55E',
    dark: '#4ADE80',
  },
  warning: {
    light: '#F59E0B',
    dark: '#FBBF24',
  },
  error: {
    light: '#EF4444',
    dark: '#F87171',
  },
  info: {
    light: '#3B82F6',
    dark: '#60A5FA',
  },
};

// Glassmorphism configurations
const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.3)',
    shadow: 'rgba(31, 41, 51, 0.12)',
    blur: 10,
    inputBackground: 'rgba(31, 41, 51, 0.25)', // Darker background for input fields
    inputBorder: 'rgba(255, 255, 255, 0.3)',
    // Secondary card style - matches button styling
    secondaryCardBackground: 'rgba(255, 255, 255, 0.1)',
    secondaryCardBorder: 'rgba(255, 255, 255, 0.3)',
  },
  dark: {
    background: 'rgba(31, 41, 51, 0.65)',
    border: 'rgba(45, 55, 72, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.35)',
    blur: 10,
    inputBackground: 'rgba(0, 0, 0, 0.35)', // Darker background for input fields
    inputBorder: 'rgba(70, 80, 100, 0.3)',
    // Secondary card style - matches button styling
    secondaryCardBackground: 'rgba(255, 255, 255, 0.1)',
    secondaryCardBorder: 'rgba(255, 255, 255, 0.3)',
  },
};

// Shadow configurations
const shadows = {
  light: {
    sm: {
      shadowColor: neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: neutral[900],
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: neutral[900],
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  dark: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};

// Main theme export
export const Colors = {
  primary,
  accent,
  neutral,
  feedback,
  glass,
  shadows,
  light: {
    text: neutral[900],
    textSecondary: neutral[600],
    background: neutral[50],
    backgroundSecondary: neutral[100],
    tint: primary[500],
    icon: neutral[600],
    tabIconDefault: neutral[500],
    tabIconSelected: primary[500],
    card: '#FFFFFF',
    border: neutral[200],
    notification: accent[500],
  },
  dark: {
    text: neutral[50],
    textSecondary: neutral[300],
    background: neutral[900],
    backgroundSecondary: neutral[800],
    tint: primary[300],
    icon: neutral[300],
    tabIconDefault: neutral[400],
    tabIconSelected: primary[300],
    card: neutral[800],
    border: neutral[700],
    notification: accent[400],
  },
};

// Type definitions
type ColorScheme = 'light' | 'dark';
type ThemeColors = typeof Colors;

// Helper to get the current theme colors
export const getThemeColors = (colorScheme: ColorScheme): typeof Colors.light => {
  return Colors[colorScheme];
};

// Define theme variations with different primary/accent colors
export const ThemeVariations = {
  default: {
    primary: primary, // Your current blue primary palette
    accent: accent,   // Your current pink accent palette
  },
  emerald: {
    primary: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      200: '#A7F3D0',
      300: '#6EE7B7',
      400: '#34D399',
      500: '#10B981', // Main brand color
      600: '#059669',
      700: '#047857',
      800: '#065F46',
      900: '#064E3B',
    },
    accent: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316', // Main accent color
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12',
    },
  },
  purple: {
    primary: {
      50: '#FAF5FF',
      100: '#F3E8FF',
      200: '#E9D5FF',
      300: '#D8B4FE',
      400: '#C084FC',
      500: '#A855F7', // Main brand color
      600: '#9333EA',
      700: '#7E22CE',
      800: '#6B21A8',
      900: '#581C87',
    },
    accent: {
      50: '#FDF2F8',
      100: '#FCE7F3',
      200: '#FBCFE8',
      300: '#F9A8D4',
      400: '#F472B6',
      500: '#EC4899', // Main accent color
      600: '#DB2777',
      700: '#BE185D',
      800: '#9D174D',
      900: '#831843',
    },
  },
};

// Export type for theme variation keys
export type ThemeVariationKey = keyof typeof ThemeVariations;

export default Colors;
