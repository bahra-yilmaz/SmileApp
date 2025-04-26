/**
 * Custom hook to get theme colors from our theme system
 * Supports overriding colors via props and accessing theme colors
 */

import { Colors } from '../constants/Colors';
import { useTheme } from '../components/ThemeProvider';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const { colorScheme, theme } = useTheme();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return theme.activeColors[colorName];
  }
}

/**
 * Helper function to get a theme property like typography, spacing, etc.
 * @param propertyPath Path to the theme property (e.g., 'typography.sizes.md')
 */
export function useThemeValue<T = any>(propertyPath: string): T {
  const { theme } = useTheme();
  return propertyPath.split('.').reduce((obj, key) => obj[key], theme as any);
}

/**
 * Get theme typography styles with the correct color
 * @param variant Typography variant (e.g., 'title', 'body', etc.)
 * @param color Optional color override
 */
export function useTextStyle(
  variant: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'xxxl', 
  color?: string
) {
  const { theme } = useTheme();
  const { typography } = theme;
  
  return {
    fontSize: typography.sizes[variant],
    lineHeight: typography.lineHeights[variant],
    color: color || theme.activeColors.text,
  };
}

export default useThemeColor;
