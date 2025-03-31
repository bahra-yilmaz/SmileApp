import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Theme, getTheme, ActiveThemeType, ColorScheme, ThemeVariation } from '../constants/Theme';

// Context interface with theme and theme control functions
interface ThemeContextType {
  theme: ActiveThemeType;
  colorScheme: ColorScheme;
  themeVariation: ThemeVariation;
  setColorScheme: (scheme: ColorScheme | 'system') => void;
  setThemeVariation: (variation: ThemeVariation) => void;
  toggleColorScheme: () => void;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: getTheme('light', 'default'),
  colorScheme: 'light',
  themeVariation: 'default',
  setColorScheme: () => {},
  setThemeVariation: () => {},
  toggleColorScheme: () => {},
});

// Custom hook to access theme context
export const useTheme = () => useContext(ThemeContext);

// ThemeProvider props
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultColorScheme?: ColorScheme | 'system';
  defaultThemeVariation?: ThemeVariation;
}

// ThemeProvider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultColorScheme = 'system',
  defaultThemeVariation = 'default',
}) => {
  // Get system color scheme
  const systemColorScheme = useColorScheme() as ColorScheme || 'light';
  
  // User preference state - can be 'light', 'dark', or 'system'
  const [userPreference, setUserPreference] = useState<ColorScheme | 'system'>(defaultColorScheme);
  
  // Active color scheme (derived from system or explicit choice)
  const [activeColorScheme, setActiveColorScheme] = useState<ColorScheme>(
    userPreference === 'system' ? systemColorScheme : userPreference
  );
  
  // Theme variation state
  const [themeVariation, setThemeVariation] = useState<ThemeVariation>(defaultThemeVariation);
  
  // Generated theme based on active color scheme and theme variation
  const [theme, setTheme] = useState<ActiveThemeType>(
    getTheme(activeColorScheme, themeVariation)
  );
  
  // Update theme when system preference, user preference, or theme variation changes
  useEffect(() => {
    const newColorScheme = userPreference === 'system' ? systemColorScheme : userPreference;
    setActiveColorScheme(newColorScheme);
    setTheme(getTheme(newColorScheme, themeVariation));
  }, [userPreference, systemColorScheme, themeVariation]);
  
  // Set color scheme (light, dark, or system)
  const setColorScheme = (scheme: ColorScheme | 'system') => {
    setUserPreference(scheme);
  };
  
  // Toggle between light and dark (ignores system setting)
  const toggleColorScheme = () => {
    setUserPreference(prev => {
      // If system, switch to the opposite of the system preference
      if (prev === 'system') {
        return systemColorScheme === 'light' ? 'dark' : 'light';
      }
      // Otherwise, toggle between light and dark
      return prev === 'light' ? 'dark' : 'light';
    });
  };
  
  // Context value
  const contextValue: ThemeContextType = {
    theme,
    colorScheme: activeColorScheme,
    themeVariation,
    setColorScheme,
    setThemeVariation,
    toggleColorScheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Default export
export default ThemeProvider; 