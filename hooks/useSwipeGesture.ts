import { useRef, useState, useEffect } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface UseSwipeGestureConfig {
  /**
   * Callback function called when the screen should be closed
   */
  onClose: () => void;
  
  /**
   * Optional callback called when swipe gesture starts
   */
  onSwipeStart?: () => void;
  
  /**
   * Optional callback called when swipe gesture ends (regardless of result)
   */
  onSwipeEnd?: () => void;
  
  /**
   * Threshold for closing the screen (0-1). Default: 0.35
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
}

interface UseSwipeGestureReturn {
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
  
  // Methods
  handleClose: () => void;
  
  // Style helpers
  getScalerStyle: (backgroundColor: string) => any;
  getPanGestureContainerStyle: () => any;
  getContentWrapperStyle: () => any;
}

/**
 * Custom hook for implementing swipe-to-dismiss functionality with scaling animations.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const swipeGesture = useSwipeGesture({
 *   onClose: () => router.back(),
 * });
 * 
 * return (
 *   <Animated.View style={swipeGesture.getPanGestureContainerStyle()} {...swipeGesture.panResponder.panHandlers}>
 *     <Animated.View style={swipeGesture.getScalerStyle('#F3F9FF')} />
 *     <Animated.View style={swipeGesture.getContentWrapperStyle()}>
 *       {/* Your content here *\/}
 *     </Animated.View>
 *   </Animated.View>
 * );
 * ```
 * 
 * @example
 * ```tsx
 * // Advanced usage with custom configuration
 * const swipeGesture = useSwipeGesture({
 *   onClose: () => router.back(),
 *   onSwipeStart: () => setIsPlaying(false),
 *   onSwipeEnd: () => console.log('Swipe ended'),
 *   threshold: 0.4, // Require 40% swipe to close
 *   velocityThreshold: 0.8, // Higher velocity threshold
 *   animationDuration: 300, // Faster animations
 *   enableHaptics: false, // Disable haptics
 * });
 * ```
 */
export const useSwipeGesture = ({
  onClose,
  onSwipeStart,
  onSwipeEnd,
  threshold = 0.35,
  velocityThreshold = 0.5,
  animationDuration = 400,
  fabButtonSize = 70,
  enableHaptics = true,
}: UseSwipeGestureConfig): UseSwipeGestureReturn => {
  // Animation constants
  const MAX_SCALE_ANIM = Math.max(screenWidth, screenHeight) * 2 / fabButtonSize;
  
  // Animation values
  const [screenAppearAnim] = useState(() => new Animated.Value(1));
  const [contentAppearAnim] = useState(() => new Animated.Value(1));
  const [gestureAnim] = useState(() => new Animated.Value(0));
  
  // State
  const [isFullyHidden, setIsFullyHidden] = useState(false);
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
  
  // Animation complete handler
  const animateCloseComplete = () => {
    setIsFullyHidden(true);
    requestAnimationFrame(() => {
      onClose();
    });
  };
  
  // Programmatic close handler
  const handleClose = () => {
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
      animateCloseComplete();
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
        if (gestureState.dy > 0) { // Only allow downward movement
          const gestureProgress = Math.min(1, gestureState.dy / (screenHeight * 0.4));
          const easedProgress = Math.pow(gestureProgress, 1.5);
          gestureAnim.setValue(easedProgress);
          contentAppearAnim.setValue(1 - easedProgress);
          if (easedProgress > 0.5) {
            screenAppearAnim.setValue(1 - (easedProgress - 0.5) * 2);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const shouldClose = 
          currentGestureValue.current > threshold ||
          (currentGestureValue.current > 0.2 && velocity > velocityThreshold);

        if (shouldClose) {
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
  const finalTransformScale = Animated.multiply(
    MAX_SCALE_ANIM,
    Animated.subtract(1, gestureAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.7],
      extrapolate: 'clamp',
    }))
  );
  
  const overallOpacity = screenAppearAnim;
  
  const animatedContentOpacity = Animated.add(
    contentAppearAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
    gestureAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -0.7, -1], extrapolate: 'clamp' })
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
    
    // Methods
    handleClose,
    
    // Style helpers
    getScalerStyle,
    getPanGestureContainerStyle,
    getContentWrapperStyle,
  };
}; 