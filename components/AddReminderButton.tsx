import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface AddReminderButtonProps {
  onPress: () => void;
  isExpanded: boolean;
  plusRotation: Animated.SharedValue<number>;
}

export default function AddReminderButton({ 
  onPress, 
  isExpanded, 
  plusRotation 
}: AddReminderButtonProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;

  const plusAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${plusRotation.value}deg` }],
    };
  });

  return (
    <Pressable onPress={onPress} style={styles.addReminderItem}>
      <View style={styles.addReminderContent}>
        <View style={styles.addReminderTextContainer}>
          <ThemedText style={[styles.addReminderText, { color: activeColors.text }]}>
            {t('settings.reminderTimes.addNew', 'Add New Reminder')}
          </ThemedText>
        </View>
        <View style={styles.addReminderToggle}>
          <Animated.View style={plusAnimatedStyle}>
            <Ionicons name="add" size={28} color="white" style={{ fontWeight: '900' }} />
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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