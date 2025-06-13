import React, { useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import * as Haptics from 'expo-haptics';

const PICKER_ITEM_HEIGHT = 40;
const VISIBLE_PICKER_ITEMS = 5;

interface HourMinutePickerProps {
  selectedHour: number;
  selectedMinute: number;
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onHourScrollRef?: (ref: ScrollView | null) => void;
  onMinuteScrollRef?: (ref: ScrollView | null) => void;
}

export default function HourMinutePicker({
  selectedHour,
  selectedMinute,
  onHourChange,
  onMinuteChange,
  onHourScrollRef,
  onMinuteScrollRef,
}: HourMinutePickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  
  const hourPickerRef = useRef<ScrollView>(null);
  const minutePickerRef = useRef<ScrollView>(null);
  const lastHourHapticIndex = useRef<number | null>(null);
  const lastMinuteHapticIndex = useRef<number | null>(null);

  // Create arrays for time pickers
  const HOURS = Array.from({ length: 24 }, (_, i) => ({ 
    id: i, 
    value: i, 
    label: i.toString().padStart(2, '0') 
  }));
  const MINUTES = Array.from({ length: 12 }, (_, i) => ({ 
    id: i, 
    value: i * 5, 
    label: (i * 5).toString().padStart(2, '0') 
  }));

  // Pass refs to parent if needed
  React.useEffect(() => {
    onHourScrollRef?.(hourPickerRef.current);
    onMinuteScrollRef?.(minutePickerRef.current);
  }, [onHourScrollRef, onMinuteScrollRef]);

  const handleHourScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);

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
      onHourChange(hour.value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleMinuteScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / PICKER_ITEM_HEIGHT);

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
      onMinuteChange(minute.value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={styles.timePickersContainer}>
      {/* Hour Picker */}
      <View style={styles.pickerColumn}>
        <ThemedText style={styles.pickerLabel}>
          {t('settings.reminderTimes.hour', 'Hour')}
        </ThemedText>
        <View style={styles.pickerWrapper}>
          <View style={styles.pickerHighlight} pointerEvents="none" />
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
                    fontFamily: 'Quicksand-Bold',
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
          <View style={styles.pickerHighlight} pointerEvents="none" />
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
                    fontFamily: 'Quicksand-Bold',
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
  );
}

const styles = StyleSheet.create({
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
}); 