import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, AppState, Animated, Easing } from 'react-native';
import { useTheme } from '../ThemeProvider';
import Svg, { Circle } from 'react-native-svg';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';

interface TimerCircleProps {
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

const TimerCircle: React.FC<TimerCircleProps> = ({
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
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [isStartPressed, setIsStartPressed] = useState(false);
  const [isBrushedPressed, setIsBrushedPressed] = useState(false);
  
  const [animatedProgressValue] = useState(() => new Animated.Value(0));
  const targetProgress = useRef(0);
  const currentProgressValue = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTime = useRef(0);

  // Get colors from theme
  const primaryColor = theme.colors.primary[600];
  const centerCircleColor = theme.colors.primary[200];
  const outerCircleColor = '#E5F2FF';
  
  // SVG and Circle calculations
  const progressCircleRadius = PROGRESS_CIRCLE_SIZE / 2;
  const svgRadius = progressCircleRadius - (PROGRESS_STROKE_WIDTH / 2);
  const center = PROGRESS_CIRCLE_SIZE / 2;
  const circumference = 2 * Math.PI * svgRadius;
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
  });
  
  const fontFamily = fontsLoaded ? 'Merienda-Bold' : 'System';
  const quicksandBold = fontsLoaded ? 'Quicksand-Bold' : 'System';
  
  // Set up value listener for progress animation
  useEffect(() => {
    const id = animatedProgressValue.addListener(({ value }) => {
      currentProgressValue.current = value;
    });
    
    return () => {
      animatedProgressValue.removeListener(id);
    };
  }, [animatedProgressValue]);
  
  // Format time as MM:SS 
  const formatTime = (mins: number, secs: number) => {
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Update the progress animation based on time props
  useEffect(() => {
    if (hasCompleted) {
      // Once the main goal is complete, lock the progress at 100%
      targetProgress.current = 1;
    } else {
      // Otherwise, calculate progress based on the countdown
      const remaining = minutes * 60 + seconds;
      const newProgress = 1 - (remaining / initialTimeInSeconds);
      const clampedNewProgress = Math.min(Math.max(newProgress, 0), 1);
      
      targetProgress.current = clampedNewProgress;
    }
  }, [minutes, seconds, initialTimeInSeconds, hasCompleted]);
  
  // Animation loop for fluid progress updates
  const animateProgress = (timestamp: number) => {
    if (!lastFrameTime.current) {
      lastFrameTime.current = timestamp;
    }
    
    const delta = timestamp - lastFrameTime.current;
    lastFrameTime.current = timestamp;
    
    const currentProgress = currentProgressValue.current;
    const step = delta / 300; // Adjust for animation speed
    
    let newValue;
    if (Math.abs(targetProgress.current - currentProgress) < step) {
      newValue = targetProgress.current;
    } else if (currentProgress < targetProgress.current) {
      newValue = currentProgress + step;
    } else {
      newValue = currentProgress - step;
    }
    
    animatedProgressValue.setValue(newValue);
    
    animationFrameRef.current = requestAnimationFrame(animateProgress);
  };
  
  // Start/stop the animation loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animateProgress);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  const progressOffset = animatedProgressValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  
  // Handle start/pause button press
  const handleStartPress = () => {
    onStartPress();
    if (!isStartPressed) {
      setIsStartPressed(true);
    }
  };
  
  // Handle brushed/done button press
  const handleBrushedPress = () => {
    onBrushedPress();
    if (!isBrushedPressed) {
      setIsBrushedPressed(true);
    }
    setTimeout(() => setIsBrushedPressed(false), 150);
  };
  
  const overtimeDisplayMinutes = Math.floor(overtimeCounter / 60);
  const overtimeDisplaySeconds = overtimeCounter % 60;

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        {/* Outer circle */}
        <View style={[styles.outerGlowContainer, { backgroundColor: outerCircleColor }]} />
        
        {/* Progress circle */}
        <View style={styles.progressContainer}>
          <Svg width={PROGRESS_CIRCLE_SIZE} height={PROGRESS_CIRCLE_SIZE}>
            <Circle
              cx={center}
              cy={center}
              r={svgRadius}
              strokeWidth={PROGRESS_STROKE_WIDTH}
              stroke="rgba(255, 255, 255, 0.05)"
              fill="transparent"
            />
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
            />
          </Svg>
        </View>
        
        {/* Inner dark circle */}
        <View style={[styles.innerCircle, { backgroundColor: centerCircleColor }]}>
          <>
            <ThemedText 
              style={[styles.timerText, { fontFamily }]}
              weight="bold"
              useDisplayFont
              lightColor={Colors.neutral[800]}
              darkColor={Colors.neutral[100]}
            >
              {isOvertime 
                ? `+${formatTime(overtimeDisplayMinutes, overtimeDisplaySeconds)}` 
                : formatTime(minutes, seconds)}
            </ThemedText>
          </>
        </View>
      </View>
      
      {/* Button container */}
      <View style={styles.buttonsContainer}>
        <View style={styles.shadowContainer}>
          <TouchableOpacity
            onPress={handleStartPress}
            style={[styles.primaryButton, isStartPressed && { transform: [{ scale: 0.95 }] }]}
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
              <ThemedText style={[styles.buttonText, { color: Colors.primary[500], fontFamily: quicksandBold }]}>
                {isRunning ? t('timerOverlay.restart') : t('timerOverlay.start')}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.shadowContainer, { marginLeft: BUTTON_SPACING }]}>
          <TouchableOpacity
            onPress={handleBrushedPress}
            style={[styles.primaryColorButton, isBrushedPressed && { transform: [{ scale: 0.95 }] }]}
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
              <ThemedText style={[styles.buttonText, { color: 'white', fontFamily: quicksandBold }]}>
                {isRunning ? t('timerOverlay.done') : t('timerOverlay.brushed')}
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 280;
const PROGRESS_STROKE_WIDTH = 25;
const INNER_CIRCLE_SIZE = CIRCLE_SIZE - 24;
const PROGRESS_CIRCLE_SIZE = INNER_CIRCLE_SIZE + PROGRESS_STROKE_WIDTH;
const OUTER_GLOW_SIZE = CIRCLE_SIZE + 60;
const BUTTON_WIDTH = 140;
const BUTTON_HEIGHT = 52;
const BUTTON_SPACING = 12;

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 10,
  },
  timerText: {
    fontFamily: 'Merienda-Bold',
    fontSize: 56,
    color: 'white',
    textAlign: 'center',
    lineHeight: 65,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
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

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default TimerCircle; 