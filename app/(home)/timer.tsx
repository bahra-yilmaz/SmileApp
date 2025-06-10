/**
 * Timer Screen - A dedicated screen for the brushing timer experience
 * Based on TimerOverlay but designed as a full screen for better onboarding flow
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet,
  Pressable,
  Animated
} from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimerCircle from '../../components/home/TimerCircle';
import SongMenu from '../../components/home/SongMenu';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';

export default function TimerScreen() {
  // Timer state - same as TimerOverlay
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(2); // Standard 2 minutes
  const [seconds, setSeconds] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeCounter, setOvertimeCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const initialTimeInSeconds = useRef(2 * 60);
  
  // Get safe area insets and router
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Get theme color - use the same color as LightContainer
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  const successSoundPlayer = useAudioPlayer(require('../../assets/sounds/success.mp3'));
  
  // Use the swipe gesture hook
  const swipeGesture = useSwipeGesture({
    onClose: () => router.back(),
    onSwipeStart: () => setIsRunning(false), // Stop timer when starting to swipe
    threshold: 0.35,
    velocityThreshold: 0.5,
    animationDuration: 400,
    enableHaptics: true,
  });
  
  // Timer logic, same as TimerOverlay
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (isOvertime) {
          // Overtime counting logic
          setOvertimeCounter(c => {
            const newCount = c + 1;
            // Stop at 3 minutes of overtime (5 minutes total)
            if (newCount >= 180) {
              setIsRunning(false);
            }
            return newCount;
          });
        } else {
          // Normal countdown logic
          setSeconds(s => {
            if (s > 0) return s - 1;
            
            setMinutes(m => {
              if (m > 0) return m - 1;

              // Timer reaches 00:00 - Goal Met
              setHasCompleted(true);
              triggerCompletionHaptics();
              playSound();
              setIsOvertime(true); // Switch to overtime mode
              // Do NOT set isRunning to false here, let it keep running
              return 0;
            });
            
            return 59; // Reset seconds to 59 when minute ticks over
          });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isOvertime]);

  const triggerCompletionHaptics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
  };
  
  const playSound = () => {
    if (successSoundPlayer.isLoaded) {
      successSoundPlayer.seekTo(0);
      successSoundPlayer.play();
    }
  }

  const resetTimer = (withHaptics = true) => {
    if (withHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
    setMinutes(2);
    setSeconds(0);
    setHasCompleted(false);
    setIsOvertime(false);
    setOvertimeCounter(0);
  };
  
  const handleStartPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (isRunning) {
      // This is a "Restart" action
      resetTimer();
    } else {
      // This is a "Start" action
      if (hasCompleted) {
        // If starting after a full run, reset completely first
        resetTimer(false); 
      }
      setIsRunning(true);
    }
  };
  
  // Handler for the "Brushed/Done" button
  const handleBrushedPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      // If timer is running, this is "Done"
      resetTimer(false); // Stop and reset
      handleNavigateToResults();
    } else {
      // If timer is not running, this is "Brushed"
      handleNavigateToResults();
    }
  };

  // Handler for navigation to results
  const handleNavigateToResults = () => {
    router.push('./BrushingResultsScreen');
  };

  // Handler for back button (uses the hook's handleClose)
  const handleBackPress = () => {
    setIsRunning(false); // Stop timer when going back
    swipeGesture.handleClose();
  };

  // Conditional rendering based on isFullyHidden
  if (swipeGesture.isFullyHidden) {
    return null;
  }

  return (
    <Animated.View 
      style={swipeGesture.getPanGestureContainerStyle()}
      {...swipeGesture.panResponder.panHandlers}
    >
      {/* Scaling circular background */}
      <Animated.View style={swipeGesture.getScalerStyle(backgroundColor)} />

      {/* Screen content wrapper */}
      <Animated.View style={swipeGesture.getContentWrapperStyle()}>
        {/* Timer Circle Component */}
        <View style={styles.contentContainer}>
          <TimerCircle 
            minutes={minutes}
            seconds={seconds}
            isRunning={isRunning}
            hasCompleted={hasCompleted}
            isOvertime={isOvertime}
            overtimeCounter={overtimeCounter}
            initialTimeInSeconds={initialTimeInSeconds.current}
            onStartPress={handleStartPress}
            onBrushedPress={handleBrushedPress}
            onResetPress={() => resetTimer()}
          />
        </View>
        
        {/* Song Menu */}
        <SongMenu />
        
        {/* Back Button in top left corner */}
        <View 
          style={[
            styles.backButtonContainer, 
            { 
              top: insets.top + 10 
            }
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              {
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.90 : 1 }]
              }
            ]}
            onPress={handleBackPress}
          >
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={28} 
              color={theme.activeColors.text} 
            />
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Allow space for back button
    paddingBottom: 20,
  },
  backButtonContainer: {
    position: 'absolute',
    left: 20,
    zIndex: 2000,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
}); 