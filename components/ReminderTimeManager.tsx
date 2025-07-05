import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import BottomSheetModal from './ui/BottomSheetModal';
import ReminderItem, { ReminderTime, ReminderItemRef } from './ReminderItem';
import AddReminderButton from './AddReminderButton';
import InlineTimePicker from './InlineTimePicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  withTiming,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import useInlinePickerScroll from '../utils/useInlinePickerScroll';
import { syncReminderNotifications } from '../services/ReminderNotificationService';

const REMINDER_TIMES_KEY = 'reminder_times';
const PICKER_ITEM_HEIGHT = 40;

interface ReminderTimeManagerProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (reminders: ReminderTime[]) => void;
}

export default function ReminderTimeManager({ visible, onClose, onUpdate }: ReminderTimeManagerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderTime | null>(null);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [reminderName, setReminderName] = useState('');
  
  const hourPickerRef = useRef<ScrollView>(null);
  const minutePickerRef = useRef<ScrollView>(null);
  const modalListRef = useRef<any>(null);
  const reminderItemRefs = useRef<{ [key: string]: ReminderItemRef | null }>({});

  // Animation values
  const timePickerOpacity = useSharedValue(0);
  const timePickerScale = useSharedValue(0.95);
  const plusRotation = useSharedValue(0);
  
  // Default reminder time options (sorted by time)
  const DEFAULT_REMINDER_TIMES: ReminderTime[] = [
    { id: 'morning', time: '08:00', label: t('settings.reminderTimes.morning', 'Morning'), enabled: true },
    { id: 'afternoon', time: '14:00', label: t('settings.reminderTimes.afternoon', 'Afternoon'), enabled: false },
    { id: 'evening', time: '20:00', label: t('settings.reminderTimes.evening', 'Evening'), enabled: true },
    { id: 'night', time: '22:00', label: t('settings.reminderTimes.night', 'Before Bed'), enabled: false },
  ];

  // Modular auto-scroll helpers
  const autoScroll = useInlinePickerScroll(modalListRef);

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
        // Ensure local notifications are up-to-date whenever we load reminders
        syncReminderNotifications(sortedTimes);
      } else {
        const sortedDefaults = sortRemindersByTime(DEFAULT_REMINDER_TIMES);
        setReminderTimes(sortedDefaults);
        onUpdate?.(sortedDefaults);
        syncReminderNotifications(sortedDefaults);
      }
    } catch (error) {
      console.error('Error loading reminder times:', error);
      const sortedDefaults = sortRemindersByTime(DEFAULT_REMINDER_TIMES);
      setReminderTimes(sortedDefaults);
      onUpdate?.(sortedDefaults);
      syncReminderNotifications(sortedDefaults);
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
      // Keep notification schedule in sync with the latest reminder set
      syncReminderNotifications(times);
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

  const handleAddReminder = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If time picker is already open for adding (not editing), close it
    if (showTimePicker && !editingReminder) {
      handleBackToList();
      return;
    }
    
    setEditingReminder(null);
    setSelectedHour(8);
    setSelectedMinute(0);
    setReminderName('');
    setShowTimePicker(true);
    
    // Animate the time picker in
    timePickerOpacity.value = withTiming(1, { duration: 300 });
    timePickerScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    
    // Rotate plus to X
    plusRotation.value = withTiming(45, { duration: 200 });
    
    // Scroll pickers to initial position and auto-scroll to expanded menu
    setTimeout(() => {
      hourPickerRef.current?.scrollTo({ y: 8 * PICKER_ITEM_HEIGHT, animated: true });
      minutePickerRef.current?.scrollTo({ y: 0, animated: true });
      autoScroll.openAdd(reminderTimes.length);
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
    
    // Scroll pickers to current values and auto-scroll to expanded menu
    setTimeout(() => {
      hourPickerRef.current?.scrollTo({ y: hour * PICKER_ITEM_HEIGHT, animated: true });
      const minuteIndex = Math.floor(minute / 5); // Convert minute to index
      minutePickerRef.current?.scrollTo({ y: minuteIndex * PICKER_ITEM_HEIGHT, animated: true });
      
      // Auto-scroll to show the expanded menu for this specific reminder
      const reminderIndex = reminderTimes.findIndex(r => r.id === reminder.id);
      if (reminderIndex !== -1) {
        autoScroll.openEdit(reminderIndex);
      }
    }, 400);
  };

  const handleBackToList = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Smooth scroll back to normal position when closing
    if (editingReminder) {
      const reminderIndex = reminderTimes.findIndex(r => r.id === editingReminder.id);
      if (reminderIndex !== -1) autoScroll.closeEdit(reminderIndex);
    } else {
      // If closing add menu, scroll to top of add button
      autoScroll.closeAdd(reminderTimes.length);
    }
    
    // Animate the time picker out
    timePickerOpacity.value = withTiming(0, { duration: 200 });
    timePickerScale.value = withTiming(0.95, { duration: 250 });
    
    // Rotate X back to plus
    plusRotation.value = withTiming(0, { duration: 200 });
    
    // Reset state after animation
    setTimeout(() => {
      runOnJS(setShowTimePicker)(false);
      runOnJS(setEditingReminder)(null);
      runOnJS(setReminderName)('');
      
      // Close swipe action if we were editing a reminder
      if (editingReminder) {
        reminderItemRefs.current[editingReminder.id]?.closeSwipe();
      }
    }, 250);
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
      
      // Smooth scroll back when saving
      if (editingReminder) {
        const reminderIndex = reminderTimes.findIndex(r => r.id === editingReminder.id);
        if (reminderIndex !== -1) autoScroll.closeEdit(reminderIndex);
      } else {
        // If saving new reminder, scroll to show the new item
        const scrollIndex = sortedTimes.length - 1;
        modalListRef.current?.scrollToIndex({ 
          index: scrollIndex, 
          animated: true,
          viewPosition: 0.4 // Show the newly added item
        });
      }
      
      // Animate out and reset state
      timePickerOpacity.value = withTiming(0, { duration: 200 });
      timePickerScale.value = withTiming(0.95, { duration: 250 });
      
      // Rotate X back to plus
      plusRotation.value = withTiming(0, { duration: 200 });
      
      setTimeout(() => {
        runOnJS(setShowTimePicker)(false);
        runOnJS(setEditingReminder)(null);
        runOnJS(setReminderName)('');
        
        // Close swipe action if we were editing a reminder
        if (editingReminder) {
          reminderItemRefs.current[editingReminder.id]?.closeSwipe();
        }
      }, 250);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert(
        t('settings.reminderTimes.error.title', 'Reminder Error'),
        t('settings.reminderTimes.error.message', 'Failed to save reminder time. Please try again.')
      );
    }
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
    return (
      <View>
        <ReminderItem
          ref={(ref) => {
            reminderItemRefs.current[reminder.id] = ref;
          }}
          reminder={reminder}
          onToggle={handleReminderToggle}
          onEdit={handleEditReminder}
          onDelete={handleDeleteReminder}
          onSwipeClose={() => {
            // Close time picker if it's open for this reminder
            if (showTimePicker && editingReminder?.id === reminder.id) {
              handleBackToList();
            }
          }}
        />
        
        {/* Inline Time Picker - appears right below this specific reminder when editing */}
        {showTimePicker && editingReminder?.id === reminder.id && (
          <InlineTimePicker
            visible={true}
            editingReminder={editingReminder}
            selectedHour={selectedHour}
            selectedMinute={selectedMinute}
            reminderName={reminderName}
            onHourChange={setSelectedHour}
            onMinuteChange={setSelectedMinute}
            onNameChange={setReminderName}
            onSave={handleTimeSave}
            onCancel={handleBackToList}
            generateDefaultName={generateDefaultName}
            timePickerOpacity={timePickerOpacity}
            timePickerScale={timePickerScale}
            onHourScrollRef={(ref) => { hourPickerRef.current = ref; }}
            onMinuteScrollRef={(ref) => { minutePickerRef.current = ref; }}
          />
        )}
      </View>
    );
  };

  const renderAddReminderItem = () => (
    <View>
      <AddReminderButton
        onPress={handleAddReminder}
        isExpanded={showTimePicker && !editingReminder}
        plusRotation={plusRotation}
      />
      
      {/* Inline Time Picker - appears right below the add button when adding new reminder */}
      {showTimePicker && !editingReminder && (
        <InlineTimePicker
          visible={true}
          editingReminder={null}
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          reminderName={reminderName}
          onHourChange={setSelectedHour}
          onMinuteChange={setSelectedMinute}
          onNameChange={setReminderName}
          onSave={handleTimeSave}
          onCancel={handleBackToList}
          generateDefaultName={generateDefaultName}
          timePickerOpacity={timePickerOpacity}
          timePickerScale={timePickerScale}
          onHourScrollRef={(ref) => { hourPickerRef.current = ref; }}
          onMinuteScrollRef={(ref) => { minutePickerRef.current = ref; }}
        />
      )}
    </View>
  );

  const renderModalItem = ({ item }: { item: any }) => {
    if (item.isAddButton) {
      return renderAddReminderItem();
    }
    return renderReminderItem({ item });
  };

  // Combined data with add option at the end
  const modalData = [
    ...reminderTimes,
    { id: 'add_new', isAddButton: true }
  ];

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('settings.reminderTimes.selectTitle', 'Set Reminder Times')}
      data={modalData}
      renderItem={renderModalItem}
      keyExtractor={(item) => item.id}
      listRef={modalListRef}
    />
  );
} 