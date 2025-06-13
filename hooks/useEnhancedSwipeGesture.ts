import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UseEnhancedSwipeGestureConfig {
  /**
   * Callback function called when the screen should be closed (swipe down)
   */
  onClose: () => void;
  
  /**
   * Callback function called when the screen should be opened (swipe up)
   */
  onOpen: () => void;
  
  /**
   * Optional callback called when swipe gesture starts
   */
  onSwipeStart?: () => void;
  
  /**
   * Optional callback called when swipe gesture ends (regardless of result)
   */
  onSwipeEnd?: () => void;
  
  /**
   * Threshold for closing/opening the screen (0-1). Default: 0.35
   */
  threshold?: number;
  
  /**
   * Velocity threshold for quick swipes. Default: 0.5
   */
  velocityThreshold?: number;
  
  /**
   * Duration of close/open animations in ms. Default: 400
   */
  animationDuration?: number;
  
  /**
   * Size of the FAB button for scaling calculations. Default: 70
   */
  fabButtonSize?: number;
  
  /**
   * Whether to enable haptic feedback. Default: true
   */
  enableHaptics?: boolean;
  
  /**
   * Whether to play the opening animation when screen appears. Default: true
   */
  shouldPlayOpeningAnimation?: boolean;
  
  /**
   * If true, the hook will not play its default close animation and will call onClose immediately.
   * Useful for screens that need a custom close animation. Default: false
   */
  overrideCloseAnimation?: boolean;
}

interface UseEnhancedSwipeGestureReturn {
  // Animation values
  screenAppearAnim: Animated.Value;
  contentAppearAnim: Animated.Value;
  gestureAnim: Animated.Value;
  
  // Pan responder
  panResponder: any;
  
  // Animation styles
  overallOpacity: Animated.Value;
  animatedContentOpacity: Animated.AnimatedAddition<string | number>;
  finalTransformScale: Animated.AnimatedMultiplication<string | number>;
  
  // State
  isFullyHidden: boolean;
  isAnimatingIn: boolean;
  
  // Methods
  handleClose: (onComplete?: () => void) => void;
  handleOpen: (onComplete?: () => void) => void;
  
  // Style helpers
  getScalerStyle: (backgroundColor: string) => any;
  getPanGestureContainerStyle: () => any;
  getContentWrapperStyle: () => any;
}

export const useEnhancedSwipeGesture = ({
  onClose,
  onOpen,
  onSwipeStart,
  onSwipeEnd,
  threshold = 0.35,
  velocityThreshold = 0.5,
  animationDuration = 400,
  fabButtonSize = 70,
  enableHaptics = true,
  shouldPlayOpeningAnimation = true,
  overrideCloseAnimation = false,
}: UseEnhancedSwipeGestureConfig): UseEnhancedSwipeGestureReturn => {
  // Animation constants
  const MAX_SCALE_ANIM = Math.max(screenWidth, screenHeight) * 2 / fabButtonSize;
  
  // Animation values - start at 0 if we should play opening animation
  const [screenAppearAnim] = useState(() => new Animated.Value(shouldPlayOpeningAnimation ? 0 : 1));
  const [contentAppearAnim] = useState(() => new Animated.Value(shouldPlayOpeningAnimation ? 0 : 1));
  const [gestureAnim] = useState(() => new Animated.Value(0));
  
  // State
  const [isFullyHidden, setIsFullyHidden] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(shouldPlayOpeningAnimation);
  const currentGestureValue = useRef(0);
  
  // Track gesture animation value
  useEffect(() => {
    const gestureListener = gestureAnim.addListener(({ value }) => {
      currentGestureValue.current = value;
    });
    return () => {
      gestureAnim.removeListener(gestureListener);
    };
  }, [gestureAnim]);
  
  // Play opening animation on mount if enabled
  useEffect(() => {
    if (shouldPlayOpeningAnimation && isAnimatingIn) {
      if (enableHaptics) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      Animated.parallel([
        Animated.timing(screenAppearAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(contentAppearAnim, {
          toValue: 1,
          duration: animationDuration,
          delay: animationDuration * 0.3, // Content appears after background starts scaling
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsAnimatingIn(false);
      });
    }
  }, [shouldPlayOpeningAnimation, isAnimatingIn, screenAppearAnim, contentAppearAnim, animationDuration, enableHaptics]);
  
  // Animation complete handlers
  const animateCloseComplete = () => {
    setIsFullyHidden(true);
    requestAnimationFrame(() => {
      onClose();
    });
  };

  const animateOpenComplete = () => {
    requestAnimationFrame(() => {
      onOpen();
    });
  };
  
  // Programmatic handlers
  const handleClose = (onComplete?: () => void) => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onSwipeStart?.();
    
    Animated.parallel([
      Animated.timing(screenAppearAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(contentAppearAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(gestureAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSwipeEnd?.();
      if (onComplete) {
        setIsFullyHidden(true);
        requestAnimationFrame(onComplete);
      } else {
        animateCloseComplete();
      }
    });
  };

  const handleOpen = (onComplete?: () => void) => {
    if (enableHaptics) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onSwipeStart?.();
    
    Animated.parallel([
      Animated.timing(screenAppearAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(contentAppearAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(gestureAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onSwipeEnd?.();
      if (onComplete) {
        requestAnimationFrame(onComplete);
      } else {
        animateOpenComplete();
      }
    });
  };
  
  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        gestureAnim.setValue(0);
        screenAppearAnim.stopAnimation();
        contentAppearAnim.stopAnimation();
        gestureAnim.stopAnimation();
        onSwipeStart?.();
      },
      onPanResponderMove: (_, gestureState) => {
        const gestureProgress = Math.min(1, Math.abs(gestureState.dy) / (screenHeight * 0.4));
        const easedProgress = Math.pow(gestureProgress, 1.5);
        
        if (gestureState.dy > 0) { // Swipe down
          gestureAnim.setValue(easedProgress);
          contentAppearAnim.setValue(1 - easedProgress);
          if (easedProgress > 0.5) {
            screenAppearAnim.setValue(1 - (easedProgress - 0.5) * 2);
          }
        } else { // Swipe up
          gestureAnim.setValue(-easedProgress);
          contentAppearAnim.setValue(1 + easedProgress);
          if (easedProgress > 0.5) {
            screenAppearAnim.setValue(1 + (easedProgress - 0.5) * 2);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const shouldClose = 
          (currentGestureValue.current > threshold || (currentGestureValue.current > 0.2 && velocity > velocityThreshold)) &&
          gestureState.dy > 0;
        
        const shouldOpen = 
          (Math.abs(currentGestureValue.current) > threshold || (Math.abs(currentGestureValue.current) > 0.2 && Math.abs(velocity) > velocityThreshold)) &&
          gestureState.dy < 0;

        if (shouldClose) {
          if (overrideCloseAnimation) {
            onClose();
            onSwipeEnd?.();
            return;
          }
          
          if (enableHaptics) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          Animated.parallel([
            Animated.timing(screenAppearAnim, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(contentAppearAnim, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(gestureAnim, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeEnd?.();
            animateCloseComplete();
          });
        } else if (shouldOpen) {
          if (enableHaptics) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          
          Animated.parallel([
            Animated.timing(screenAppearAnim, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(contentAppearAnim, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
            }),
            Animated.timing(gestureAnim, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeEnd?.();
            animateOpenComplete();
          });
        } else {
          // Spring back to original position
          Animated.parallel([
            Animated.spring(screenAppearAnim, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(contentAppearAnim, {
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(gestureAnim, {
              toValue: 0,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeEnd?.();
          });
        }
      },
    })
  ).current;
  
  // Computed animation styles
  const baseScale = screenAppearAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, MAX_SCALE_ANIM], // Start from FAB size (1) to full screen
  });
  
  const finalTransformScale = Animated.multiply(
    baseScale,
    Animated.subtract(1, gestureAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0.7, 0, 0.7],
      extrapolate: 'clamp',
    }))
  );
  
  const overallOpacity = screenAppearAnim;
  
  const animatedContentOpacity = Animated.add(
    contentAppearAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    gestureAnim.interpolate({ 
      inputRange: [-1, -0.3, 0, 0.3, 1], 
      outputRange: [-1, -0.7, 0, -0.7, -1], 
      extrapolate: 'clamp' 
    })
  );
  
  // Style helper functions
  const getScalerStyle = (backgroundColor: string) => ({
    position: 'absolute' as const,
    bottom: 45,
    left: '50%',
    marginLeft: -(fabButtonSize / 2), // Center horizontally to match FAB position
    width: fabButtonSize,
    height: fabButtonSize,
    borderRadius: fabButtonSize / 2,
    backgroundColor,
    opacity: overallOpacity,
    transform: [{ scale: finalTransformScale }],
  });
  
  const getPanGestureContainerStyle = () => ({
    flex: 1,
    opacity: overallOpacity,
  });
  
  const getContentWrapperStyle = () => ({
    ...require('react-native').StyleSheet.absoluteFillObject,
    opacity: animatedContentOpacity,
  });
  
  return {
    // Animation values
    screenAppearAnim,
    contentAppearAnim,
    gestureAnim,
    
    // Pan responder
    panResponder,
    
    // Animation styles
    overallOpacity,
    animatedContentOpacity,
    finalTransformScale,
    
    // State
    isFullyHidden,
    isAnimatingIn,
    
    // Methods
    handleClose,
    handleOpen,
    
    // Style helpers
    getScalerStyle,
    getPanGestureContainerStyle,
    getContentWrapperStyle,
  };
}; 