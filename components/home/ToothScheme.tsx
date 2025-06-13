import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';
import TimerControls from './TimerControls';

interface ToothSchemeProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  hasCompleted: boolean;
  isOvertime: boolean;
  overtimeCounter: number;
  initialTimeInSeconds: number;
  onStartPress: () => void;
  onBrushedPress: () => void;
  onResetPress: () => void;
}

export default function ToothScheme({
  minutes,
  seconds,
  isRunning,
  hasCompleted,
  isOvertime,
  overtimeCounter,
  initialTimeInSeconds,
  onStartPress,
  onBrushedPress,
  onResetPress,
}: ToothSchemeProps) {
  const { theme } = useTheme();

  // Calculate progress for tooth highlighting
  const totalSeconds = minutes * 60 + seconds;
  const progress = 1 - (totalSeconds / initialTimeInSeconds);

  return (
    <View style={styles.container}>
      {/* Placeholder for tooth scheme */}
      <View style={styles.placeholder}>
        <MaterialCommunityIcons 
          name="tooth" 
          size={200} 
          color={theme.activeColors.text} 
        />
        <View style={styles.timeDisplay}>
          <MaterialCommunityIcons 
            name="clock-outline" 
            size={24} 
            color={theme.activeColors.text} 
          />
          <Text style={styles.timeText}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </Text>
        </View>
      </View>

      <TimerControls
        isRunning={isRunning}
        onStartPress={onStartPress}
        onBrushedPress={onBrushedPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '600',
  },
}); 