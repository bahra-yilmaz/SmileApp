import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, AppState, Animated, Easing } from 'react-native';
import { useTheme } from '../ThemeProvider';
import Svg, { Circle } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';

interface TimerCircleProps {
  progress?: number; // 0 to 1
  onStartPress?: () => void; // Callback for start button
  onBrushedPress?: () => void; // Callback for brushed button
  initialMinutes?: number; // Initial time in minutes
  initialSeconds?: number; // Initial time in seconds
}

const TimerCircle: React.FC<TimerCircleProps> = ({ 
  progress: initialProgress = 0.18, // Default to 18% progress to match reference
  onStartPress = () => {}, // Default empty function
  onBrushedPress = () => {}, // Default empty function
  initialMinutes = 2,
  initialSeconds = 0
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isStartPressed, setIsStartPressed] = useState(false);
  const [isBrushedPressed, setIsBrushedPressed] = useState(false);
  
  // Timer states
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [progress, setProgress] = useState(initialProgress);
  const animatedProgressValue = useRef(new Animated.Value(initialProgress)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);
  const totalInitialTimeInSeconds = useRef(initialMinutes * 60 + initialSeconds);
  const standardTimeInSeconds = useRef(2 * 60); // 2 minutes as the standard time
  const remainingTimeInSeconds = useRef(totalInitialTimeInSeconds.current);
  const lastTickTime = useRef(0);
  
  // Get colors from theme
  const primaryColor = theme.colors.primary[600]; // Primary color for progress circle
  const centerCircleColor = theme.colors.primary[200]; // Lighter primary for center circle
  const outerCircleColor = '#E5F2FF'; // Specified light blue color
  
  // Calculate radius so the inner edge of progress circle exactly meets the outer edge of inner circle
  const innerRadius = INNER_CIRCLE_SIZE / 2;
  const progressCircleRadius = PROGRESS_CIRCLE_SIZE / 2;
  const svgRadius = progressCircleRadius - (PROGRESS_STROKE_WIDTH / 2);
  
  // Calculate SVG parameters for progress circle
  const center = PROGRESS_CIRCLE_SIZE / 2;
  const circumference = 2 * Math.PI * svgRadius;
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
  });
  
  // Use Merienda-Bold if loaded, fallback to system font
  const fontFamily = fontsLoaded ? 'Merienda-Bold' : 'System';
  const quicksandMedium = fontsLoaded ? 'Quicksand-Medium' : 'System';
  const quicksandBold = fontsLoaded ? 'Quicksand-Bold' : 'System';
  
  // Add animation frame request reference
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);
  const targetProgress = useRef(initialProgress);
  const currentProgressValue = useRef(initialProgress);
  
  // Set up value listener only once
  useEffect(() => {
    const id = animatedProgressValue.addListener(({ value }) => {
      currentProgressValue.current = value;
    });
    
    return () => {
      animatedProgressValue.removeListener(id);
    };
  }, []);
  
  // Format time as MM:SS 
  const formatTime = (mins: number, secs: number) => {
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Update the progress based on remaining time with fluid animation
  const updateProgress = () => {
    const remaining = minutes * 60 + seconds;
    remainingTimeInSeconds.current = remaining;
    
    // Calculate new progress value
    const newProgress = 1 - (remaining / standardTimeInSeconds.current);
    // Clamp progress between 0 and 1
    const clampedNewProgress = Math.min(Math.max(newProgress, 0), 1);
    
    // Set the target progress - animation loop will animate towards this
    targetProgress.current = clampedNewProgress;
    
    // Also update the state progress for components that need it
    setProgress(clampedNewProgress);
  };
  
  // Animation loop for fluid progress updates
  const animateProgress = (timestamp: number) => {
    if (!lastFrameTime.current) {
      lastFrameTime.current = timestamp;
    }
    
    const delta = timestamp - lastFrameTime.current;
    lastFrameTime.current = timestamp;
    
    // Get current progress value from our ref that's kept updated by the listener
    const currentProgress = currentProgressValue.current;
    
    // Calculate the step based on the time delta (faster updates for smoother animation)
    // Adjust the divisor to control animation speed - higher = slower
    const step = delta / 300;
    
    // Move towards target
    let newValue;
    if (Math.abs(targetProgress.current - currentProgress) < step) {
      newValue = targetProgress.current; // Snap to target if close enough
    } else if (currentProgress < targetProgress.current) {
      newValue = currentProgress + step; // Move up
    } else {
      newValue = currentProgress - step; // Move down
    }
    
    // Set the new value
    animatedProgressValue.setValue(newValue);
    
    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  };
  
  // Start/stop the animation loop based on component lifecycle
  useEffect(() => {
    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animateProgress);
    
    return () => {
      // Clean up animation loop
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Use animatedProgressValue for the progress circle
  const progressOffset = animatedProgressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Tick function for the timer with better timing precision
  const tick = () => {
    const now = Date.now();
    // Adjust for any timing drift
    const elapsed = now - lastTickTime.current;
    const ticksToProcess = Math.floor(elapsed / 1000);
    
    if (ticksToProcess >= 1) {
      lastTickTime.current = now - (elapsed % 1000); // Store remainder for next tick
      
      if (minutes > 0 || seconds > 0) {
        // Normal countdown
        setSeconds(prevSeconds => {
          if (prevSeconds === 0) {
            // If seconds is 0, decrement minutes and set seconds to 59
            setMinutes(prevMinutes => {
              if (prevMinutes === 0) {
                // Timer has ended
                clearInterval(timerRef.current!);
                setIsRunning(false);
                return 0;
              }
              return prevMinutes - 1;
            });
            return 59;
          } else {
            // Just decrement seconds
            return prevSeconds - 1;
          }
        });
      }
    }
  };
  
  // Initialize timer on component mount
  useEffect(() => {
    resetTimer();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Effect to run/stop the timer with precise timing
  useEffect(() => {
    if (isRunning) {
      // Start with current time reference for accurate intervals
      lastTickTime.current = Date.now();
      // Tick more frequently for smoother updates
      timerRef.current = setInterval(tick, 100); // Check 10 times per second
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);
  
  // Effect to update progress when time changes
  useEffect(() => {
    updateProgress();
  }, [minutes, seconds]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        if (isRunning) {
          // Adjust time if timer was running when app went to background
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - backgroundTime.current) / 1000);
          updateTimeAfterBackground(elapsedSeconds);
        }
      } else if (nextAppState.match(/inactive|background/) && appState.current === 'active') {
        // App has gone to the background
        backgroundTime.current = Date.now();
      }
      
      appState.current = nextAppState;
    });
    
    return () => {
      subscription.remove();
    };
  }, [isRunning]);
  
  // Store the time when app goes to background
  const backgroundTime = useRef(0);
  
  // Update timer after coming back from background
  const updateTimeAfterBackground = (elapsedSeconds: number) => {
    if (elapsedSeconds > 0) {
      let newRemainingTime = Math.max(0, remainingTimeInSeconds.current - elapsedSeconds);
      
      // Update minutes and seconds
      const newMinutes = Math.floor(newRemainingTime / 60);
      const newSeconds = newRemainingTime % 60;
      
      setMinutes(newMinutes);
      setSeconds(newSeconds);
      
      // If timer ended while in background
      if (newRemainingTime === 0) {
        setIsRunning(false);
      }
    }
  };
  
  // Reset timer to initial values
  const resetTimer = () => {
    setMinutes(initialMinutes);
    setSeconds(initialSeconds);
    setProgress(0); // Reset to empty
    
    // Set target progress to 0 for smooth animation
    targetProgress.current = 0;
    
    remainingTimeInSeconds.current = totalInitialTimeInSeconds.current;
  };
  
  // Handle start/pause button press
  const handleStartPress = () => {
    setIsStartPressed(true);
    
    // If timer is already running, restart it (reset and stop)
    if (isRunning) {
      resetTimer();
      // Stop the timer after resetting
      setIsRunning(false);
    } else {
      // If timer is at 0, reset before starting
      if (minutes === 0 && seconds === 0) {
        resetTimer();
      }
      // Start the timer
      setIsRunning(true);
    }
    
    onStartPress();
    
    // Reset pressed state after a short delay to show animation
    setTimeout(() => setIsStartPressed(false), 150);
  };
  
  // Handle brushed/done button press
  const handleBrushedPress = () => {
    setIsBrushedPressed(true);
    
    if (isRunning) {
      // If timer is running, this is "Done" - stop the timer and reset
      setIsRunning(false);
      resetTimer();
    } else {
      // If timer is not running, this is "Brushed" - just reset the timer
      resetTimer();
    }
    
    onBrushedPress();
    
    // Reset pressed state after a short delay to show animation
    setTimeout(() => setIsBrushedPressed(false), 150);
  };
  
  return (
    <View style={styles.mainContainer}>
      {/* All circles compound into one visual element */}
      <View style={styles.container}>
        {/* Outer circle - simple background color */}
        <View style={[
          styles.outerGlowContainer,
          { backgroundColor: outerCircleColor }
        ]} />
        
        {/* Progress circle */}
        <View style={styles.progressContainer}>
          <Svg width={PROGRESS_CIRCLE_SIZE} height={PROGRESS_CIRCLE_SIZE}>
            {/* Background track (very faint) */}
            <Circle
              cx={center}
              cy={center}
              r={svgRadius}
              strokeWidth={PROGRESS_STROKE_WIDTH}
              stroke="rgba(255, 255, 255, 0.05)"
              fill="transparent"
            />
            
            {/* Progress indicator with animated strokeDashoffset */}
            <AnimatedCircle
              cx={center}
              cy={center}
              r={svgRadius}
              strokeWidth={PROGRESS_STROKE_WIDTH}
              stroke={primaryColor}
              fill="transparent"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={progressOffset}
              transform={`rotate(-90, ${center}, ${center})`}
              filter="drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.3))"
            />
          </Svg>
        </View>
        
        {/* Inner dark circle */}
        <View style={[
          styles.innerCircle,
          { backgroundColor: centerCircleColor }
        ]}>
          {/* Time display */}
          <Text style={[styles.timeText, { fontFamily }]}>
            {formatTime(minutes, seconds)}
          </Text>
        </View>
      </View>
      
      {/* Button container for both buttons */}
      <View style={styles.buttonsContainer}>
        {/* Start Button - Primary style with white background */}
        <View style={styles.shadowContainer}>
          <TouchableOpacity
            onPress={handleStartPress}
            style={[
              styles.primaryButton,
              isStartPressed && { transform: [{ scale: 0.95 }] },
            ]}
            activeOpacity={0.9}
          >
            <View style={styles.contentContainer}>
              <View style={styles.buttonIconContainer}>
                <MaterialCommunityIcons 
                  name={isRunning ? "refresh" : "play"} 
                  size={28} 
                  color={Colors.primary[500]} 
                />
              </View>
              <ThemedText 
                style={[
                  styles.buttonText,
                  { 
                    color: Colors.primary[500],
                    fontFamily: quicksandBold
                  }
                ]}
              >
                {isRunning ? t('timerOverlay.restart') : t('timerOverlay.start')}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Brushed Button - Primary style but with primary color fill */}
        <View style={[styles.shadowContainer, { marginLeft: BUTTON_SPACING }]}>
          <TouchableOpacity
            onPress={handleBrushedPress}
            style={[
              styles.primaryColorButton,
              isBrushedPressed && { transform: [{ scale: 0.95 }] }
            ]}
            activeOpacity={0.9}
          >
            <View style={styles.contentContainer}>
              <View style={styles.buttonIconContainer}>
                <MaterialCommunityIcons 
                  name={isRunning ? "check" : "plus"} 
                  size={28} 
                  color="white" 
                />
              </View>
              <ThemedText 
                style={[
                  styles.buttonText,
                  { 
                    color: 'white', 
                    fontFamily: quicksandBold
                  }
                ]}
              >
                {isRunning ? t('timerOverlay.done') : t('timerOverlay.brushed')}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

// Calculate exact dimensions for perfect alignment
const CIRCLE_SIZE = 280; // Base size
const PROGRESS_STROKE_WIDTH = 25; // Increased from 18 to 25 for a thicker progress ring
const INNER_CIRCLE_SIZE = CIRCLE_SIZE - 24; // Adjusted to eliminate gap
const PROGRESS_CIRCLE_SIZE = INNER_CIRCLE_SIZE + PROGRESS_STROKE_WIDTH; // Exactly surrounds inner circle
const OUTER_GLOW_SIZE = CIRCLE_SIZE + 60; // Size of glow effect
const BUTTON_WIDTH = 140; // Width of each button
const BUTTON_HEIGHT = 52; // Height of each button (slightly lower than original 60)
const BUTTON_SPACING = 12; // Spacing between buttons

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlowContainer: {
    width: OUTER_GLOW_SIZE,
    height: OUTER_GLOW_SIZE,
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: OUTER_GLOW_SIZE / 2,
  },
  progressContainer: {
    position: 'absolute',
    width: PROGRESS_CIRCLE_SIZE,
    height: PROGRESS_CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    // Add shadow for the progress container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  innerCircle: {
    width: INNER_CIRCLE_SIZE,
    height: INNER_CIRCLE_SIZE,
    borderRadius: INNER_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced shadow to lift it from background and extend to progress bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10, // Ensure inner circle appears above progress bar
  },
  timeText: {
    color: 'white',
    fontSize: 48,
    fontWeight: '400', // Adjusted for Merienda
    letterSpacing: 1, // Slightly reduced for Merienda
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80, // Increased from 60 to 80 (20px more as requested)
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 30,
  },
  primaryButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryColorButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 30,
    backgroundColor: Colors.primary[500],
    borderWidth: 1,
    borderColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 30,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },  
  buttonIconContainer: {
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 2,
  },
});

// Create AnimatedCircle component using Animated.createAnimatedComponent
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default TimerCircle; 