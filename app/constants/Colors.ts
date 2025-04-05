export const Colors = {
  light: {
    text: '#000000',
    background: '#FFFFFF',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#45B7D1',
    card: '#F7F7F7',
    border: '#E5E5E5',
    notification: '#FF3B30',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    accent: '#45B7D1',
    card: '#1C1C1E',
    border: '#2C2C2E',
    notification: '#FF453A',
    error: '#FF453A',
    success: '#32D74B',
    warning: '#FFD60A',
  },
};

export type ThemeVariationKey = 'default' | 'blue' | 'purple' | 'green';

export const ThemeVariations: Record<ThemeVariationKey, { primary: string; accent: string }> = {
  default: {
    primary: '#FF6B6B',
    accent: '#45B7D1',
  },
  blue: {
    primary: '#007AFF',
    accent: '#5856D6',
  },
  purple: {
    primary: '#AF52DE',
    accent: '#5856D6',
  },
  green: {
    primary: '#34C759',
    accent: '#30B0C7',
  },
}; 