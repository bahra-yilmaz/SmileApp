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
      {/* Main Content Container - Centers everything relative to screen */}
      <View style={styles.mainContentContainer}>
        {/* Timer Circle */}
        <View style={styles.timerContainer}>
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
        </View>

        {/* Control Buttons - Positioned below the timer circle */}
        <View style={styles.controlsContainer}>
          <TimerControls
            isRunning={isRunning}
            onStartPress={onStartPress}
            onBrushedPress={onBrushedPress}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 