import React from 'react';
import { View, StyleSheet } from 'react-native';
import TimerCircle from './TimerCircle';
import TimerControls from './TimerControls';

interface TimerCircleModeProps {
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

export default function TimerCircleMode({
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
}: TimerCircleModeProps) {
  return (
    <View style={styles.container}>
      <TimerCircle 
        minutes={minutes}
        seconds={seconds}
        isRunning={isRunning}
        hasCompleted={hasCompleted}
        isOvertime={isOvertime}
        overtimeCounter={overtimeCounter}
        initialTimeInSeconds={initialTimeInSeconds}
        onStartPress={onStartPress}
        onBrushedPress={onBrushedPress}
        onResetPress={onResetPress}
      />
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
}); 