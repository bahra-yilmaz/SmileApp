import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Alert, Text, FlatList, TextInput, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  runOnJS
} from 'react-native-reanimated';

const REMINDER_TIMES_KEY = 'reminder_times';
const { width } = Dimensions.get('window');
const PICKER_ITEM_HEIGHT = 40;
const VISIBLE_PICKER_ITEMS = 5;

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderTime | null>(null);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [reminderName, setReminderName] = useState('');
  
  const hourPickerRef = useRef<ScrollView>(null);
  const minutePickerRef = useRef<ScrollView>(null);
  const lastHourHapticIndex = useRef<number | null>(null);
  const lastMinuteHapticIndex = useRef<number | null>(null);

  
  // Animation values
  const timePickerOpacity = useSharedValue(0);
  const timePickerScale = useSharedValue(0.95);
  
  // Create arrays for time pickers
  const HOURS = Array.from({ length: 24 }, (_, i) => ({ id: i, value: i, label: i.toString().padStart(2, '0') }));
  const MINUTES = Array.from({ length: 4 }, (_, i) => ({ id: i, value: i * 15, label: (i * 15).toString().padStart(2, '0') }));
  
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

  const generateDefaultName = (hour: number): string => {
    if (hour >= 5 && hour < 12) {
      return t('settings.reminderTimes.morning', 'Morning');
    } else if (hour >= 12 && hour < 17) {
      return t('settings.reminderTimes.afternoon', 'Afternoon');
    } else if (hour >= 17 && hour < 21) {
      return t('settings.reminderTimes.evening', 'Evening');
    } else {
      return t('settings.reminderTimes.night', 'Night');
    }
  };



  const handleTimeSave = async () => {
    try {
      const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
      const finalName = reminderName.trim() || generateDefaultName(selectedHour);
      let updatedTimes: ReminderTime[];
      
      if (editingReminder) {
        // Edit existing reminder
        updatedTimes = reminderTimes.map(time => 
          time.id === editingReminder.id 
            ? { ...time, time: formattedTime, label: finalName }
            : time
        );
      } else {
        // Add new reminder
        const newReminder: ReminderTime = {
          id: `custom_${Date.now()}`,
          time: formattedTime,
          label: finalName,
          enabled: true,
          isCustom: true
        };
        updatedTimes = [...reminderTimes, newReminder];
      }
      
      const sortedTimes = sortRemindersByTime(updatedTimes);
      setReminderTimes(sortedTimes);
      await saveReminderTimes(sortedTimes);
      
      // Animate out and reset state
      timePickerOpacity.value = withTiming(0, { duration: 200 });
      timePickerScale.value = withTiming(0.95, { duration: 250 });
      
      setTimeout(() => {
        runOnJS(setShowTimePicker)(false);
        runOnJS(setEditingReminder)(null);
        runOnJS(setReminderName)('');
      }, 250);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        t('settings.reminderTimes.error.title', 'Reminder Error'),
        t('settings.reminderTimes.error.message', 'Failed to save reminder time. Please try again.')
      );
    }
  };

  const handleAddReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingReminder(null);
    setSelectedHour(8);
    setSelectedMinute(0);
    setReminderName('');
    setShowTimePicker(true);
    
    // Animate the time picker in
    timePickerOpacity.value = withTiming(1, { duration: 300 });
    timePickerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
              // Scroll pickers to initial position after animation
    setTimeout(() => {
      hourPickerRef.current?.scrollTo({ y: 8 * PICKER_ITEM_HEIGHT, animated: true });
      minutePickerRef.current?.scrollTo({ y: 0, animated: true });
    }, 400);
  };

  const handleEditReminder = (reminder: ReminderTime) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const [hour, minute] = reminder.time.split(':').map(Number);
    setEditingReminder(reminder);
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setReminderName(reminder.isCustom ? reminder.label : '');
    setShowTimePicker(true);
    
    // Animate the time picker in
    timePickerOpacity.value = withTiming(1, { duration: 300 });
    timePickerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
              // Scroll pickers to current values after animation
    setTimeout(() => {
      hourPickerRef.current?.scrollTo({ y: hour * PICKER_ITEM_HEIGHT, animated: true });
      const minuteIndex = MINUTES.findIndex(m => m.value === minute);
      minutePickerRef.current?.scrollTo({ y: (minuteIndex !== -1 ? minuteIndex : 0) * PICKER_ITEM_HEIGHT, animated: true });
    }, 400);
  };

  const handleBackToList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the time picker out
    timePickerOpacity.value = withTiming(0, { duration: 200 });
    timePickerScale.value = withTiming(0.95, { duration: 250 });
    
    // Reset state after animation
    setTimeout(() => {
      runOnJS(setShowTimePicker)(false);
      runOnJS(setEditingReminder)(null);
      runOnJS(setReminderName)('');
    }, 250);
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
      <Swipeable 
        renderRightActions={renderRightActions}
        friction={2}
        leftThreshold={30}
        rightThreshold={40}
      >
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
    <View>
      <Pressable onPress={handleAddReminder} style={styles.addReminderItem}>
        <View style={styles.addReminderContent}>
          <Ionicons name="add-circle-outline" size={24} color={activeColors.tint} />
          <ThemedText style={[styles.addReminderText, { color: activeColors.tint }]}>
            {t('settings.reminderTimes.addNew', 'Add New Reminder')}
          </ThemedText>
        </View>
      </Pressable>
      
      {/* Inline Time Picker - appears right below the add button */}
      {showTimePicker && renderTimePickerContent()}
    </View>
  );

  // Combined data with add option at the end
  const modalData = [
    ...reminderTimes,
    { id: 'add_new', isAddButton: true }
  ];



  const handleHourScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);

    // Trigger a light-impact haptic every time the wheel passes over a new item
    if (index >= 0 && index < HOURS.length && index !== lastHourHapticIndex.current) {
      lastHourHapticIndex.current = index;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleHourMomentumScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);
    const hour = HOURS[index];
    
    if (hour !== undefined && hour.value !== selectedHour) {
      setSelectedHour(hour.value);
      // Add a medium-impact haptic for selection confirmation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleMinuteScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);

    // Trigger a light-impact haptic every time the wheel passes over a new item
    if (index >= 0 && index < MINUTES.length && index !== lastMinuteHapticIndex.current) {
      lastMinuteHapticIndex.current = index;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMinuteMomentumScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);
    const minute = MINUTES[index];
    
    if (minute !== undefined && minute.value !== selectedMinute) {
      setSelectedMinute(minute.value);
      // Add a medium-impact haptic for selection confirmation
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };



  const timePickerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: timePickerOpacity.value,
      transform: [{ scale: timePickerScale.value }],
    };
  });

  const renderTimePickerContent = () => (
    <Animated.View style={[styles.timePickerContainer, timePickerAnimatedStyle]}>
      {/* Separator Line */}
      <View style={styles.timePickerSeparator} />
      
      {/* Header */}
      <View style={styles.timePickerInlineHeader}>
        <ThemedText style={styles.timePickerInlineTitle}>
          {editingReminder 
            ? t('settings.reminderTimes.editTime', 'Edit Time')
            : t('settings.reminderTimes.addTime', 'Add New Time')
          }
        </ThemedText>
        <Pressable 
          onPress={handleBackToList}
          style={styles.cancelButton}
        >
          <Ionicons name="close" size={20} color="rgba(255, 255, 255, 0.7)" />
        </Pressable>
      </View>

      {/* Name Input */}
      <View style={styles.nameInputContainer}>
        <ThemedText style={styles.nameInputLabel}>
          {t('settings.reminderTimes.nameLabel', 'Reminder Name')}
        </ThemedText>
        <TextInput
          style={styles.nameInput}
          value={reminderName}
          onChangeText={setReminderName}
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
      <View style={styles.timePickersContainer}>
        {/* Hour Picker */}
        <View style={styles.pickerColumn}>
          <ThemedText style={styles.pickerLabel}>
            {t('settings.reminderTimes.hour', 'Hour')}
          </ThemedText>
          <View style={styles.pickerWrapper}>
            <View style={styles.pickerHighlight} />
            <ScrollView
              ref={hourPickerRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={PICKER_ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={handleHourMomentumScrollEnd}
              onScroll={handleHourScroll}
              scrollEventThrottle={16}
              style={styles.picker}
              contentContainerStyle={{
                paddingVertical: (VISIBLE_PICKER_ITEMS - 1) * PICKER_ITEM_HEIGHT / 2,
              }}
            >
              {HOURS.map((item) => (
                <View key={item.id.toString()} style={styles.pickerItem}>
                  <ThemedText style={[
                    styles.pickerItemText,
                    item.value === selectedHour && { 
                      color: theme.activeColors.tint,
                      fontSize: 20,
                    }
                  ]}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Minute Picker */}
        <View style={styles.pickerColumn}>
          <ThemedText style={styles.pickerLabel}>
            {t('settings.reminderTimes.minute', 'Minute')}
          </ThemedText>
          <View style={styles.pickerWrapper}>
            <View style={styles.pickerHighlight} />
            <ScrollView
              ref={minutePickerRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={PICKER_ITEM_HEIGHT}
              decelerationRate="fast"
              onMomentumScrollEnd={handleMinuteMomentumScrollEnd}
              onScroll={handleMinuteScroll}
              scrollEventThrottle={16}
              style={styles.picker}
              contentContainerStyle={{
                paddingVertical: (VISIBLE_PICKER_ITEMS - 1) * PICKER_ITEM_HEIGHT / 2,
              }}
            >
              {MINUTES.map((item) => (
                <View key={item.id.toString()} style={styles.pickerItem}>
                  <ThemedText style={[
                    styles.pickerItemText,
                    item.value === selectedMinute && { 
                      color: theme.activeColors.tint,
                      fontSize: 20,
                    }
                  ]}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.inlineActionButtons}>
        <Pressable 
          style={styles.cancelInlineButton}
          onPress={handleBackToList}
        >
          <ThemedText style={styles.cancelInlineButtonText}>
            {t('common.cancel', 'Cancel')}
          </ThemedText>
        </Pressable>
        
        <Pressable 
          style={styles.saveTimeButton}
          onPress={handleTimeSave}
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
  // Time Picker Styles
  timePickerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timePickerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  timePickerInlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  timePickerInlineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
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
  timePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  pickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 10,
    fontWeight: '600',
  },
  pickerWrapper: {
    height: PICKER_ITEM_HEIGHT * VISIBLE_PICKER_ITEMS,
    width: 80,
    position: 'relative',
  },
  pickerHighlight: {
    position: 'absolute',
    height: PICKER_ITEM_HEIGHT,
    width: '100%',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: '50%',
    marginTop: -PICKER_ITEM_HEIGHT / 2,
    zIndex: 1,
  },
  picker: {
    flex: 1,
  },
  pickerItem: {
    height: PICKER_ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
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
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  saveTimeButton: {
    flex: 1,
    backgroundColor: 'rgba(0, 100, 255, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveTimeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
}); 