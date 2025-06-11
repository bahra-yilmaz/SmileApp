import React from 'react';
import { View, StyleSheet, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import HourMinutePicker from './HourMinutePicker';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { ReminderTime } from './ReminderItem';

interface InlineTimePickerProps {
  visible: boolean;
  editingReminder: ReminderTime | null;
  selectedHour: number;
  selectedMinute: number;
  reminderName: string;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  generateDefaultName: (hour: number) => string;
  timePickerOpacity: Animated.SharedValue<number>;
  timePickerScale: Animated.SharedValue<number>;
  onHourScrollRef?: (ref: ScrollView | null) => void;
  onMinuteScrollRef?: (ref: ScrollView | null) => void;
}

export default function InlineTimePicker({
  visible,
  editingReminder,
  selectedHour,
  selectedMinute,
  reminderName,
  onHourChange,
  onMinuteChange,
  onNameChange,
  onSave,
  onCancel,
  generateDefaultName,
  timePickerOpacity,
  timePickerScale,
  onHourScrollRef,
  onMinuteScrollRef,
}: InlineTimePickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const timePickerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: timePickerOpacity.value,
      transform: [{ scale: timePickerScale.value }],
    };
  });

  if (!visible) return null;

  return (
    <Animated.View style={[styles.timePickerContainer, timePickerAnimatedStyle]}>
      {/* Separator Line */}
      <View style={styles.timePickerSeparator} />

      {/* Name Input */}
      <View style={styles.nameInputContainer}>
        <ThemedText style={styles.nameInputLabel}>
          {t('settings.reminderTimes.nameLabel', 'Reminder Name')}
        </ThemedText>
        <TextInput
          style={styles.nameInput}
          value={reminderName}
          onChangeText={onNameChange}
          placeholder={generateDefaultName(selectedHour)}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          maxLength={20}
        />
      </View>

      {/* Time Display */}
      <View style={styles.timeDisplay}>
        <Text style={styles.timeDisplayText}>
          {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
        </Text>
      </View>

      {/* Time Pickers */}
      <HourMinutePicker
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        onHourChange={onHourChange}
        onMinuteChange={onMinuteChange}
        onHourScrollRef={onHourScrollRef}
        onMinuteScrollRef={onMinuteScrollRef}
      />

      {/* Action Buttons */}
      <View style={styles.inlineActionButtons}>
        <Pressable 
          style={styles.cancelInlineButton}
          onPress={onCancel}
        >
          <ThemedText style={styles.cancelInlineButtonText}>
            {t('common.cancel', 'Cancel')}
          </ThemedText>
        </Pressable>
        
        <Pressable 
          style={[styles.saveTimeButton, { backgroundColor: theme.colors.primary[500] }]}
          onPress={onSave}
        >
          <ThemedText style={styles.saveTimeButtonText}>
            {editingReminder 
              ? t('common.save', 'Save Changes')
              : t('settings.reminderTimes.addReminder', 'Add Reminder')
            }
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timePickerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  nameInputContainer: {
    marginBottom: 20,
  },
  nameInputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
    fontWeight: '600',
  },
  nameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
  },
  timeDisplayText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'monospace',
  },
  inlineActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  cancelInlineButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelInlineButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  saveTimeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveTimeButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: 'white',
  },
}); 