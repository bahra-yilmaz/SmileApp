import React from 'react';
import { View, StyleSheet, Pressable, Animated as RNAnimated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import * as Haptics from 'expo-haptics';

// Modular colors for reuse across the app
const COLORS = {
  destructive: '#D32F2F', // Modern Material Design red
};

export interface ReminderTime {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  isCustom?: boolean;
}

interface ReminderItemProps {
  reminder: ReminderTime;
  onToggle: (id: string) => void;
  onEdit: (reminder: ReminderTime) => void;
  onDelete: (id: string) => void;
  onSwipeClose?: () => void;
}

export default function ReminderItem({ 
  reminder, 
  onToggle, 
  onEdit, 
  onDelete, 
  onSwipeClose 
}: ReminderItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;

  const renderRightActions = (progressAnimatedValue: RNAnimated.AnimatedInterpolation<number>) => {
    const opacity = progressAnimatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0.8, 1],
      extrapolate: 'clamp',
    });

    const scale = progressAnimatedValue.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.9, 1],
      extrapolate: 'clamp',
    });

    return (
      <RNAnimated.View style={[
        styles.swipeActions, 
        {
          opacity,
          transform: [{ scale }],
        }
      ]}>
        <Pressable 
          style={[styles.swipeAction, styles.editAction, { backgroundColor: theme.colors.primary[500] }]}
          onPress={() => onEdit(reminder)}
        >
          <Ionicons name="pencil" size={28} color="white" />
        </Pressable>
        <Pressable 
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => onDelete(reminder.id)}
        >
          <Ionicons name="trash" size={28} color="white" />
        </Pressable>
      </RNAnimated.View>
    );
  };

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(reminder.id);
  };

  return (
    <Swipeable 
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={30}
      rightThreshold={40}
      overshootRight={false}
      onSwipeableClose={onSwipeClose}
    >
      <Pressable
        onPress={handleToggle}
        style={[
          styles.reminderItem,
          {
            backgroundColor: reminder.enabled 
              ? 'rgba(0, 100, 255, 0.3)' 
              : 'rgba(255, 255, 255, 0.1)'
          }
        ]}
      >
        <View style={styles.reminderContent}>
          <View style={styles.reminderTextContainer}>
            <ThemedText style={[
              styles.reminderTime,
              {
                color: reminder.enabled ? 'white' : theme.colors.primary[700],
                opacity: 1
              }
            ]}>
              {reminder.time}
            </ThemedText>
            <ThemedText style={[
              styles.reminderLabel,
              {
                color: reminder.enabled ? 'white' : activeColors.text,
                opacity: 0.6
              }
            ]}>
              {reminder.label}
            </ThemedText>
          </View>
          <View style={[
            styles.reminderToggle,
            {
              backgroundColor: reminder.enabled ? activeColors.tint : 'rgba(255, 255, 255, 0.3)'
            }
          ]}>
            {reminder.enabled && (
              <Ionicons name="checkmark" size={16} color="white" style={{ fontWeight: 'bold' }} />
            )}
          </View>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'space-between',
  },
  reminderTextContainer: {
    flex: 1,
  },
  reminderTime: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
    fontWeight: '600',
  },
  reminderLabel: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    marginTop: 2,
  },
  reminderToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingLeft: 12,
    paddingVertical: 8,
    paddingBottom: 18,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  editAction: {
    // Background color applied dynamically with theme
  },
  deleteAction: {
    backgroundColor: COLORS.destructive,
  },
}); 