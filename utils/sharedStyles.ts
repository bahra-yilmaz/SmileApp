import { StyleSheet } from 'react-native';

/**
 * Shared styles and style utilities used across the app.
 * These styles promote consistency and reduce code duplication.
 */

// Common card styles
export const cardStyles = StyleSheet.create({
  /**
   * Secondary card style - matches button styling
   * Use this for cards that should have the same appearance as secondary buttons
   */
  secondaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  /**
   * Base card container for consistent card sizing and layout
   */
  baseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  
  /**
   * Tone card style - for Nubo tone selection and similar layouts
   */
  toneCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
    minHeight: 120,
  },
});

// Common button styles matching AddReminderButton pattern
export const buttonStyles = StyleSheet.create({
  /**
   * AddReminderButton-style layout
   */
  addReminderItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  
  addReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  addReminderTextContainer: {
    flex: 1,
  },
  
  addReminderText: {
    fontSize: 16,
    opacity: 0.8,
  },
  
  addReminderToggle: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Common layout styles
export const layoutStyles = StyleSheet.create({
  /**
   * Standard horizontal content layout with icon + text
   */
  horizontalContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  /**
   * Standard icon container sizing
   */
  iconContainer: {
    marginRight: 16,
  },
  
  /**
   * Flexible text container for horizontal layouts
   */
  textContainer: {
    flex: 1,
  },
});

// Helper functions for dynamic styling
export const getSecondaryCardStyle = (theme: any) => ({
  backgroundColor: theme.colors.glass[theme.colorScheme].secondaryCardBackground,
  borderColor: theme.colors.glass[theme.colorScheme].secondaryCardBorder,
});

export const getCardStyle = (width: number) => ({
  ...cardStyles.baseCard,
  width,
});

// Export individual style groups for easier imports
export default {
  cardStyles,
  buttonStyles,
  layoutStyles,
}; 