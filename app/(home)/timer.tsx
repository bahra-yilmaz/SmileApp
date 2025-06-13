/**
 * Timer Screen - A dedicated screen for the brushing timer experience
 * Supports multiple timer visualization modes
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet,
  Pressable,
  Animated,
  Dimensions
} from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimerCircleMode from '../../components/home/TimerCircleMode';
import ToothScheme from '../../components/home/ToothScheme';
import SongMenu from '../../components/home/SongMenu';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useSwipeUpGesture } from '../../hooks/useSwipeUpGesture';
import { eventBus } from '../../utils/EventBus';

const { height: screenHeight } = Dimensions.get('window');

// Timer mode enum for type safety
enum TimerMode {
  CIRCLE = 'circle',
  TOOTH_SCHEME = 'tooth_scheme'
}

export default function TimerScreen() {
  // Timer state management
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeCounter, setOvertimeCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const initialTimeInSeconds = useRef(2 * 60);
  
  // Mode state
  const [currentMode, setCurrentMode] = useState<TimerMode>(TimerMode.CIRCLE);
  const modeAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);
  
  // Get safe area insets and router
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Get theme color
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  const successSoundPlayer = useAudioPlayer(require('../../assets/sounds/success.mp3'));
  
  // Swipe-down gesture for closing the screen
  const swipeDownGesture = useSwipeGesture({
    onClose: () => router.back(),
    onSwipeStart: () => setIsRunning(false),
    threshold: 0.35,
    velocityThreshold: 0.5,
    animationDuration: 400,
    enableHaptics: true,
  });

  // Independent swipe-up gesture for toggling timer mode
  const swipeUpGesture = useSwipeUpGesture({
    onSwipeUp: () => {
      if (!isAnimating.current) {
        toggleTimerMode();
      }
    },
    distanceThreshold: 60,
    velocityThreshold: 0.3,
    enableHaptics: true,
  });

  // Toggle between timer modes
  const toggleTimerMode = () => {
    if (isAnimating.current) return;
    
    isAnimating.current = true;
    const newMode = currentMode === TimerMode.CIRCLE ? TimerMode.TOOTH_SCHEME : TimerMode.CIRCLE;
    setCurrentMode(newMode);
    
    Animated.spring(modeAnim, {
      toValue: newMode === TimerMode.TOOTH_SCHEME ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => {
      isAnimating.current = false;
    });
  };
  
  // Listen for the close event from other screens
  useEffect(() => {
    const unsubscribe = eventBus.on('close-timer', () => {
      if (swipeDownGesture?.handleClose) {
        swipeDownGesture.handleClose();
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [swipeDownGesture]);

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
    swipeDownGesture.handleClose();
  };

  if (swipeDownGesture.isFullyHidden) {
    return null;
  }

  // Calculate the mode transition animations
  const modeTranslateY = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenHeight * 0.2],
  });

  const circleModeOpacity = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  const toothSchemeOpacity = modeAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  // Timer state to pass to both modes
  const timerState = {
    minutes,
    seconds,
    isRunning,
    hasCompleted,
    isOvertime,
    overtimeCounter,
    initialTimeInSeconds: initialTimeInSeconds.current,
    onStartPress: handleStartPress,
    onBrushedPress: handleBrushedPress,
    onResetPress: () => resetTimer(),
  };

  return (
    <Animated.View
      style={swipeDownGesture.getPanGestureContainerStyle()}
      {...swipeDownGesture.panResponder.panHandlers}
    >
      {/* Scaling circular background */}
      <Animated.View style={swipeDownGesture.getScalerStyle(backgroundColor)} />

      {/* Screen content wrapper */}
      <Animated.View
        style={swipeDownGesture.getContentWrapperStyle()}
        {...swipeUpGesture.panResponder.panHandlers}
      >
        {/* Timer Circle Mode */}
        <Animated.View style={[
          styles.contentContainer,
          {
            opacity: circleModeOpacity,
            transform: [{ translateY: modeTranslateY }]
          }
        ]}>
          <TimerCircleMode {...timerState} />
        </Animated.View>

        {/* Tooth Scheme Mode */}
        <Animated.View style={[
          styles.contentContainer,
          styles.toothSchemeContainer,
          {
            opacity: toothSchemeOpacity,
            transform: [{ translateY: Animated.add(modeTranslateY, screenHeight * 0.2) }]
          }
        ]}>
          <ToothScheme {...timerState} />
        </Animated.View>
        
        {/* Song Menu */}
        <SongMenu />
        
        {/* Close Button */}
        <View 
          style={[
            styles.closeButtonContainer, 
            { top: insets.top + 10 }
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

        {/* Swipe Indicator */}
        <View style={[styles.swipeIndicator, { bottom: insets.bottom + 20 }]}>
          <MaterialCommunityIcons 
            name="chevron-up"
            size={24} 
            color={theme.activeColors.text} 
            style={styles.swipeIcon}
          />
          <MaterialCommunityIcons 
            name="chevron-up"
            size={24} 
            color={theme.activeColors.text} 
            style={[styles.swipeIcon, { opacity: 0.5 }]}
          />
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
    paddingTop: 60,
    paddingBottom: 20,
  },
  toothSchemeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  },
  swipeIndicator: {
    position: 'absolute',
    left: '50%',
    marginLeft: -12,
    alignItems: 'center',
    gap: -8,
  },
  swipeIcon: {
    opacity: 0.8,
  }
}); 