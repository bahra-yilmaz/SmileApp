import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, Alert, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const REMINDER_TIMES_KEY = 'reminder_times';

// Export the interface
export interface ReminderTime {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  isCustom?: boolean;
}

interface ReminderTimeManagerProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (reminders: ReminderTime[]) => void;
}

export default function ReminderTimeManager({ visible, onClose, onUpdate }: ReminderTimeManagerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;
  
  const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>([]);
  
  // Default reminder time options (sorted by time)
  const DEFAULT_REMINDER_TIMES: ReminderTime[] = [
    { id: 'morning', time: '08:00', label: t('settings.reminderTimes.morning', 'Morning'), enabled: true },
    { id: 'afternoon', time: '14:00', label: t('settings.reminderTimes.afternoon', 'Afternoon'), enabled: false },
    { id: 'evening', time: '20:00', label: t('settings.reminderTimes.evening', 'Evening'), enabled: true },
    { id: 'night', time: '22:00', label: t('settings.reminderTimes.night', 'Before Bed'), enabled: false },
  ];

  useEffect(() => {
    if (visible) {
      loadReminderTimes();
    }
  }, [visible]);

  const loadReminderTimes = async () => {
    try {
      const storedTimes = await AsyncStorage.getItem(REMINDER_TIMES_KEY);
      if (storedTimes) {
        const timesData = JSON.parse(storedTimes);
        const sortedTimes = sortRemindersByTime(timesData);
        setReminderTimes(sortedTimes);
        onUpdate?.(sortedTimes);
      } else {
        const sortedDefaults = sortRemindersByTime(DEFAULT_REMINDER_TIMES);
        setReminderTimes(sortedDefaults);
        onUpdate?.(sortedDefaults);
      }
    } catch (error) {
      console.error('Error loading reminder times:', error);
      const sortedDefaults = sortRemindersByTime(DEFAULT_REMINDER_TIMES);
      setReminderTimes(sortedDefaults);
      onUpdate?.(sortedDefaults);
    }
  };

  const sortRemindersByTime = (reminders: ReminderTime[]) => {
    return [...reminders].sort((a, b) => {
      const timeA = a.time.split(':').map(Number);
      const timeB = b.time.split(':').map(Number);
      const minutesA = timeA[0] * 60 + timeA[1];
      const minutesB = timeB[0] * 60 + timeB[1];
      return minutesA - minutesB;
    });
  };

  const saveReminderTimes = async (times: ReminderTime[]) => {
    try {
      await AsyncStorage.setItem(REMINDER_TIMES_KEY, JSON.stringify(times));
      onUpdate?.(times);
    } catch (error) {
      console.error('Error saving reminder times:', error);
      throw error;
    }
  };

  const validateTimeFormat = (timeString: string): boolean => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
  };

  const formatTime = (timeString: string): string => {
    // Add leading zeros if needed
    const [hour, minute] = timeString.split(':');
    return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  const handleTimeSave = async (inputTime: string, isEdit: boolean, existingReminder?: ReminderTime) => {
    try {
      const trimmedTime = inputTime.trim();
      
      if (!validateTimeFormat(trimmedTime)) {
        Alert.alert(
          t('settings.reminderTimes.error.title', 'Invalid Time'),
          t('settings.reminderTimes.error.invalidFormat', 'Please enter a valid time in HH:MM format (e.g., 14:30)')
        );
        return;
      }

      const formattedTime = formatTime(trimmedTime);
      let updatedTimes: ReminderTime[];
      
      if (isEdit && existingReminder) {
        // Edit existing reminder
        updatedTimes = reminderTimes.map(time => 
          time.id === existingReminder.id 
            ? { ...time, time: formattedTime }
            : time
        );
      } else {
        // Add new reminder
        const newReminder: ReminderTime = {
          id: `custom_${Date.now()}`,
          time: formattedTime,
          label: t('settings.reminderTimes.custom', 'Custom'),
          enabled: true,
          isCustom: true
        };
        updatedTimes = [...reminderTimes, newReminder];
      }
      
      const sortedTimes = sortRemindersByTime(updatedTimes);
      setReminderTimes(sortedTimes);
      await saveReminderTimes(sortedTimes);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        t('settings.reminderTimes.error.title', 'Reminder Error'),
        t('settings.reminderTimes.error.message', 'Failed to save reminder time. Please try again.')
      );
    }
  };

  const showTimeInputDialog = (isEdit: boolean = false, reminder?: ReminderTime) => {
    const title = isEdit ? t('settings.reminderTimes.editTime', 'Edit Time') : t('settings.reminderTimes.addTime', 'Add New Time');
    const currentTime = isEdit && reminder ? reminder.time : '08:00';
    
    Alert.prompt(
      title,
      t('settings.reminderTimes.enterTime', 'Enter time (HH:MM format, e.g., 14:30)'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('common.save', 'Save'),
          onPress: (inputText) => {
            if (inputText) {
              handleTimeSave(inputText, isEdit, reminder);
            }
          },
        },
      ],
      'plain-text',
      currentTime
    );
  };

  const handleAddReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTimeInputDialog(false);
  };

  const handleEditReminder = (reminder: ReminderTime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTimeInputDialog(true, reminder);
  };

  const handleReminderToggle = async (timeId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const updatedTimes = reminderTimes.map(time => 
        time.id === timeId ? { ...time, enabled: !time.enabled } : time
      );
      const sortedTimes = sortRemindersByTime(updatedTimes);
      setReminderTimes(sortedTimes);
      await saveReminderTimes(sortedTimes);
    } catch (error) {
      Alert.alert(
        t('settings.reminderTimes.error.title', 'Reminder Error'),
        t('settings.reminderTimes.error.message', 'Failed to update reminder time. Please try again.')
      );
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const updatedTimes = reminderTimes.filter(time => time.id !== reminderId);
      const sortedTimes = sortRemindersByTime(updatedTimes);
      setReminderTimes(sortedTimes);
      await saveReminderTimes(sortedTimes);
    } catch (error) {
      Alert.alert(
        t('settings.reminderTimes.error.title', 'Reminder Error'),
        t('settings.reminderTimes.error.message', 'Failed to delete reminder time. Please try again.')
      );
    }
  };

  const renderReminderItem = ({ item: reminder }: { item: ReminderTime }) => {
    const renderRightActions = () => (
      <View style={styles.swipeActions}>
        <Pressable 
          style={[styles.swipeAction, styles.deleteAction]}
          onPress={() => handleDeleteReminder(reminder.id)}
        >
          <Ionicons name="trash" size={20} color="white" />
          <ThemedText style={styles.swipeActionText}>
            {t('common.delete', 'Delete')}
          </ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.swipeAction, styles.editAction]}
          onPress={() => handleEditReminder(reminder)}
        >
          <Ionicons name="pencil" size={20} color="white" />
          <ThemedText style={styles.swipeActionText}>
            {t('common.edit', 'Edit')}
          </ThemedText>
        </Pressable>
      </View>
    );

    return (
      <Swipeable renderRightActions={renderRightActions}>
        <Pressable
          onPress={() => handleReminderToggle(reminder.id)}
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
              <View style={styles.reminderLabelRow}>
                <ThemedText style={[
                  styles.reminderLabel,
                  {
                    color: reminder.enabled ? 'white' : activeColors.text
                  }
                ]}>
                  {reminder.label}
                </ThemedText>
                {reminder.isCustom && (
                  <View style={styles.customBadge}>
                    <ThemedText style={styles.customBadgeText}>
                      {t('settings.reminderTimes.customBadge', 'Custom')}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={[
                styles.reminderTime,
                {
                  color: reminder.enabled ? 'white' : activeColors.textSecondary,
                  opacity: reminder.enabled ? 1 : 0.8
                }
              ]}>
                {reminder.time}
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
  };

  const renderAddReminderItem = () => (
    <Pressable onPress={handleAddReminder} style={styles.addReminderItem}>
      <View style={styles.addReminderContent}>
        <Ionicons name="add-circle-outline" size={24} color={activeColors.tint} />
        <ThemedText style={[styles.addReminderText, { color: activeColors.tint }]}>
          {t('settings.reminderTimes.addNew', 'Add New Reminder')}
        </ThemedText>
      </View>
    </Pressable>
  );

  // Combined data with add option at the end
  const modalData = [
    ...reminderTimes,
    { id: 'add_new', isAddButton: true }
  ];

  const renderModalItem = ({ item }: { item: any }) => {
    if (item.isAddButton) {
      return renderAddReminderItem();
    }
    return renderReminderItem({ item });
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('settings.reminderTimes.selectTitle', 'Set Reminder Times')}
      data={modalData}
      renderItem={renderModalItem}
      keyExtractor={(item) => item.id}
    />
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
  reminderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderLabel: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    marginBottom: 2,
  },
  reminderTime: {
    fontSize: 14,
    opacity: 0.8,
  },
  reminderToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  customBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  customBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  swipeAction: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    width: 80,
  },
  editAction: {
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteAction: {
    backgroundColor: '#FF5722',
  },
  swipeActionText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
    fontWeight: 'bold',
  },
  addReminderItem: {
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 100, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(0, 100, 255, 0.1)',
  },
  addReminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReminderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
  },
}); 