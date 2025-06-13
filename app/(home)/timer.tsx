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
  Dimensions,
  Text
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
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Countdown from '../../components/home/Countdown';

const { height: screenHeight } = Dimensions.get('window');

// Timer mode enum for type safety
enum TimerMode {
  CIRCLE = 'circle',
  TOOTH_SCHEME = 'tooth_scheme'
}

const TIMER_MODE_STORAGE_KEY = '@SmileApp:timerMode';

export default function TimerScreen() {
  // Timer state management
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [overtimeCounter, setOvertimeCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const initialTimeInSeconds = useRef(2 * 60);
  
  // Mode state
  const [currentMode, setCurrentMode] = useState<TimerMode | null>(null);
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
      toggleTimerMode();
    },
    distanceThreshold: 60,
    velocityThreshold: 0.3,
    enableHaptics: true,
  });

  // Load initial timer mode from storage
  useEffect(() => {
    const loadTimerMode = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(TIMER_MODE_STORAGE_KEY) as TimerMode | null;
        const initialMode = storedMode || TimerMode.CIRCLE;
        setCurrentMode(initialMode);

        // Set initial animation value without animating
        modeAnim.setValue(initialMode === TimerMode.TOOTH_SCHEME ? 1 : 0);
      } catch (e) {
        // Fallback to default if there's an error
        setCurrentMode(TimerMode.CIRCLE);
        modeAnim.setValue(0);
      }
    };

    loadTimerMode();
  }, []);

  const saveTimerMode = async (mode: TimerMode) => {
    try {
      await AsyncStorage.setItem(TIMER_MODE_STORAGE_KEY, mode);
    } catch (e) {
      console.error('Failed to save timer mode to storage', e);
    }
  };

  // Toggle between timer modes (now only used for programmatic calls)
  const toggleTimerMode = () => {
    if (isAnimating.current) {
      return;
    }
    
    isAnimating.current = true;
    // Use a callback to ensure we have the latest state
    setCurrentMode(prevMode => {
      const newMode = prevMode === TimerMode.CIRCLE ? TimerMode.TOOTH_SCHEME : TimerMode.CIRCLE;
      
      saveTimerMode(newMode); // Persist the new mode
      
      Animated.timing(modeAnim, {
        toValue: newMode === TimerMode.TOOTH_SCHEME ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        isAnimating.current = false;
      });
      return newMode;
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
      setShowCountdown(true);
    }
  };
  
  const handleCountdownFinish = () => {
    setShowCountdown(false);
    setIsRunning(true);
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

  // Move useTranslation hook before any early returns
  const { t } = useTranslation();

  // Render a loading state or null until the mode is determined
  if (currentMode === null) {
    return null; // Or a loading spinner
  }

  if (swipeDownGesture.isFullyHidden) {
    return null;
  }

  // Calculate the mode transition animations
  const circleModeOpacity = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const toothSchemeOpacity = modeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
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
        {...(showCountdown ? {} : swipeUpGesture.panResponder.panHandlers)}
        {...swipeUpGesture.panResponder.panHandlers}
      >
        {/* Timer Circle Mode */}
        <Animated.View style={[
          styles.contentContainer,
          {
            opacity: circleModeOpacity,
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
        <View style={[styles.swipeIndicator, { bottom: insets.bottom + 0 }]}>
          <MaterialCommunityIcons 
            name="chevron-up"
            size={24} 
            color={theme.activeColors.text} 
            style={styles.swipeIcon}
          />
          <Text style={[styles.swipeText, { color: theme.activeColors.text }]}>
            {currentMode === TimerMode.CIRCLE ? 'Swipe up for tooth view' : 'Swipe up for timer view'}
          </Text>
        </View>
      </Animated.View>

      {/* Countdown Overlay */}
      {showCountdown && (
        <Countdown onCountdownFinish={handleCountdownFinish} />
      )}
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
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeIcon: {
    opacity: 0.8,
  },
  swipeText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    fontWeight: '500',
  }
}); 