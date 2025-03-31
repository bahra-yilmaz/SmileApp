import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';

interface ThemeToggleProps {
  compact?: boolean;
}

/**
 * A component that allows users to toggle between light and dark mode
 */
export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { colorScheme, toggleColorScheme, theme } = useTheme();
  const { colors, spacing, borderRadius } = theme;
  
  const isDark = colorScheme === 'dark';
  
  return (
    <Pressable
      onPress={toggleColorScheme}
      style={({ pressed }) => [
        styles.container,
        {
          opacity: pressed ? 0.8 : 1,
          backgroundColor: theme.activeColors.backgroundSecondary,
          borderRadius: borderRadius.pill,
          paddingHorizontal: compact ? spacing.md : spacing.lg,
          paddingVertical: compact ? spacing.xs : spacing.sm,
        },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: isDark }}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <View style={styles.iconContainer}>
        {isDark ? (
          // Moon icon for dark mode
          <View style={styles.iconWrapper}>
            <View 
              style={[
                styles.icon, 
                { 
                  backgroundColor: colors.neutral[300],
                  borderColor: colors.neutral[300] 
                }
              ]} 
            />
          </View>
        ) : (
          // Sun icon for light mode
          <View style={styles.iconWrapper}>
            <View 
              style={[
                styles.icon, 
                { 
                  backgroundColor: colors.primary[400],
                  borderColor: colors.primary[400] 
                }
              ]} 
            />
          </View>
        )}
      </View>
      
      {!compact && (
        <ThemedText style={styles.text}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  iconWrapper: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  text: {
    fontWeight: '500',
  },
});

export default ThemeToggle; 