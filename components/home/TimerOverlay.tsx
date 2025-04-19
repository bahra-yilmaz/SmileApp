/**
 * Empty overlay component with expanding animation from action button.
 * Closes simultaneously with scrolling gesture.
 */

import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  TouchableOpacity
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimerCircle from './TimerCircle';

// Custom hook for timer overlay animations
const useTimerOverlayAnimation = (isVisible: boolean, onClose: () => void) => {
  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const gestureAnim = useRef(new Animated.Value(0)).current;
  const [animationComplete, setAnimationComplete] = useState(false);
  const currentGestureValue = useRef(0);
  
  // Get screen dimensions for calculations
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const buttonSize = 70; // Size of the action button
  const maxScale = Math.max(screenWidth, screenHeight) * 2 / buttonSize;
  
  // Closure thresholds
  const minCloseThreshold = 0.35; // 35% scrolled to consider it as closing intent
  const minVelocity = 0.5; // Minimum velocity to consider for quick flick gestures
  
  // Listen for changes in the gesture animation value
  useEffect(() => {
    const gestureListener = gestureAnim.addListener(({ value }) => {
      currentGestureValue.current = value;
    });
    
    return () => {
      gestureAnim.removeListener(gestureListener);
    };
  }, [gestureAnim]);
  
  // Animation effects for opening
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      gestureAnim.setValue(0);
      expandAnim.setValue(0);
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      setAnimationComplete(false);
    }
  }, [isVisible, expandAnim, gestureAnim]);
  
  // Handle close button press with animation
  const handleClosePress = () => {
    Animated.parallel([
      Animated.timing(gestureAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(expandAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      onClose();
    });
  };
  
  // Configure pan responder for scrolling gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Don't capture taps
      onStartShouldSetPanResponderCapture: () => false, // Don't capture taps
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to significant vertical gestures
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        // Only capture significant vertical gestures
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        gestureAnim.setValue(0);
        gestureAnim.stopAnimation();
        expandAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          const gestureProgress = Math.min(1, gestureState.dy / (screenHeight * 0.4));
          const easedProgress = Math.pow(gestureProgress, 1.5);
          gestureAnim.setValue(easedProgress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const shouldClose = 
          currentGestureValue.current > minCloseThreshold || 
          (currentGestureValue.current > 0.2 && velocity > minVelocity);
        
        if (shouldClose) {
          Animated.timing(gestureAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          Animated.spring(gestureAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      }
    })
  ).current;
  
  // Calculate animations for different parts of the overlay
  const getAnimatedValues = () => {
    // Base scale
    const baseScale = expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.01, maxScale],
    });
    
    // Apply gesture effect to scale
    const finalScale = Animated.multiply(
      baseScale,
      Animated.subtract(1, gestureAnim)
    );
    
    // Calculate opacity
    const opacity = Animated.multiply(
      expandAnim,
      Animated.subtract(1, gestureAnim)
    );
    
    // Close button opacity
    const closeButtonOpacity = expandAnim.interpolate({
      inputRange: [0.9, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp'
    });
    
    // Content opacity animation
    const contentOpacity = Animated.add(
      expandAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      gestureAnim.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, -0.7, -1],
        extrapolate: 'clamp'
      })
    );
    
    return {
      finalScale,
      opacity,
      closeButtonOpacity,
      contentOpacity
    };
  };
  
  return {
    animationComplete,
    panResponder,
    handleClosePress,
    getAnimatedValues,
    maxScale
  };
};

// Overlay background component
const OverlayBackground = ({ 
  backgroundColor, 
  opacity, 
  finalScale 
}: { 
  backgroundColor: string, 
  opacity: Animated.AnimatedInterpolation<number>, 
  finalScale: Animated.AnimatedInterpolation<number> 
}) => (
  <Animated.View
    style={[
      styles.expandingCircle,
      {
        backgroundColor,
        opacity,
        transform: [{ scale: finalScale }],
      }
    ]}
  />
);

// Close button component
const CloseButton = ({ 
  onPress, 
  opacity, 
  insets, 
  textColor 
}: { 
  onPress: () => void, 
  opacity: Animated.AnimatedInterpolation<number>, 
  insets: { top: number }, 
  textColor: string 
}) => (
  <Animated.View 
    style={[
      styles.closeButtonContainer, 
      { 
        opacity, 
        top: insets.top + 10
      }
    ]}
    pointerEvents="box-none"
  >
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name="chevron-down" 
        size={28} 
        color={textColor} 
      />
    </TouchableOpacity>
  </Animated.View>
);

// Content container component
const ContentContainer = ({ 
  opacity 
}: { 
  opacity: Animated.AnimatedInterpolation<number> 
}) => (
  <Animated.View
    style={[
      styles.contentContainer,
      { opacity }
    ]}
    pointerEvents="box-none"
  >
    <TimerCircle />
  </Animated.View>
);

// Main timer overlay component
interface OverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TimerOverlay: React.FC<OverlayProps> = ({ isVisible, onClose }) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  
  const {
    animationComplete,
    panResponder,
    handleClosePress,
    getAnimatedValues
  } = useTimerOverlayAnimation(isVisible, onClose);
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  const { finalScale, opacity, contentOpacity } = getAnimatedValues();
  
  return (
    <View 
      style={styles.container} 
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Background expanding circle */}
      <OverlayBackground 
        backgroundColor={backgroundColor}
        opacity={opacity}
        finalScale={finalScale}
      />
      
      {/* Content container with timer */}
      {isVisible && (
        <ContentContainer opacity={contentOpacity} />
      )}
      
      {/* Close Button */}
      {isVisible && (
        <CloseButton 
          onPress={handleClosePress}
          opacity={contentOpacity}
          insets={insets}
          textColor={theme.activeColors.text}
        />
      )}
      
      {/* Overlay area for gestures */}
      {isVisible && (
        <View 
          style={styles.touchableArea}
          {...panResponder.panHandlers}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1500,
  },
  expandingCircle: {
    position: 'absolute',
    bottom: 45, // Same position as the action button
    width: 70, // Same size as the action button
    height: 70,
    borderRadius: 35, // Circle shape
  },
  contentContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 60, // Allow space for close button
    paddingBottom: 20,
    zIndex: 1600, // Above the background but below the close button
  },
  touchableArea: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 2000, // Above the overlay
    pointerEvents: 'box-none',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default TimerOverlay; 