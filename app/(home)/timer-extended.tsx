/**
 * Extended Timer Screen - A dedicated screen for the brushing timer experience
 * Shown when swiping up from the main timer screen
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
import { useEnhancedSwipeGesture } from '../../hooks/useEnhancedSwipeGesture';
import { eventBus } from '../../utils/EventBus';

export default function ExtendedTimerScreen() {
  // Timer state management
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
  
  // Use the enhanced swipe gesture hook
  const swipeGesture = useEnhancedSwipeGesture({
    onClose: () => router.back(),
    onOpen: () => {}, // No-op since we're already in the extended view
    onSwipeStart: () => setIsRunning(false), // Stop timer when starting to swipe
    threshold: 0.35,
    velocityThreshold: 0.5,
    animationDuration: 400,
    enableHaptics: true,
  });
  
  // Listen for the close event from other screens
  useEffect(() => {
    const unsubscribe = eventBus.on('close-timer', () => {
      if (swipeGesture?.handleClose) {
        swipeGesture.handleClose();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [swipeGesture]);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (isOvertime) {
          setOvertimeCounter(c => {
            const newCount = c + 1;
            if (newCount >= 180) {
              setIsRunning(false);
            }
            return newCount;
          });
        } else {
          setSeconds(s => {
            if (s > 0) return s - 1;
            
            setMinutes(m => {
              if (m > 0) return m - 1;

              setHasCompleted(true);
              triggerCompletionHaptics();
              playSound();
              setIsOvertime(true);
              return 0;
            });
            
            return 59;
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
      resetTimer();
    } else {
      if (hasCompleted) {
        resetTimer(false); 
      }
      setIsRunning(true);
    }
  };
  
  const handleBrushedPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      resetTimer(false);
      handleNavigateToResults();
    } else {
      handleNavigateToResults();
    }
  };

  const handleNavigateToResults = () => {
    router.push('./BrushingResultsScreen');
  };

  const handleClosePress = () => {
    setIsRunning(false);
    swipeGesture.handleClose();
  };

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
        
        {/* Close Button in top right corner */}
        <View 
          style={[
            styles.closeButtonContainer, 
            { 
              top: insets.top + 10 
            }
          ]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              {
                opacity: pressed ? 0.7 : 1,
                transform: [{ scale: pressed ? 0.90 : 1 }]
              }
            ]}
            onPress={handleClosePress}
          >
            <MaterialCommunityIcons 
              name="chevron-down" 
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
    paddingTop: 60, // Allow space for close button
    paddingBottom: 20,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 2000,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
}); 