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
  Pressable
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimerCircle from './TimerCircle';
import SongMenu from './SongMenu';

interface OverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TimerOverlay: React.FC<OverlayProps> = ({ isVisible, onClose }) => {
  // Animation values
  const expandAnim = useRef(new Animated.Value(0)).current;
  const gestureAnim = useRef(new Animated.Value(0)).current;
  
  // Track animation completion and current gesture value
  const [animationComplete, setAnimationComplete] = useState(false);
  const currentGestureValue = useRef(0);
  
  // Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // Get theme color - use the same color as LightContainer
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  
  // Get screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate the maximum scale needed to cover the screen from a small circle
  const buttonSize = 70; // Size of the action button
  const maxScale = Math.max(screenWidth, screenHeight) * 2 / buttonSize;
  
  // Closure thresholds - modified to require more deliberate input
  const minCloseThreshold = 0.35; // 35% scrolled to consider it as closing intent (up from 10%)
  const minVelocity = 0.5; // Minimum velocity to consider for quick flick gestures
  
  // Listen for changes in the gesture animation value
  useEffect(() => {
    // Set up listener for gesture animation value
    const gestureListener = gestureAnim.addListener(({ value }) => {
      currentGestureValue.current = value;
    });
    
    // Clean up listener when component unmounts
    return () => {
      gestureAnim.removeListener(gestureListener);
    };
  }, [gestureAnim]);
  
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
        // When gesture starts, make sure we're starting from 0
        gestureAnim.setValue(0);
        // Stop any running animations
        gestureAnim.stopAnimation();
        expandAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow downward movement (positive dy values)
        if (gestureState.dy > 0) {
          // Calculate gesture progress (0 to 1)
          // Adjust sensitivity - require more scrolling (40% of screen height instead of 20%)
          const gestureProgress = Math.min(1, gestureState.dy / (screenHeight * 0.4));
          
          // Apply easing to make the initial movement less sensitive
          // This creates a more gradual effect at the beginning
          const easedProgress = Math.pow(gestureProgress, 1.5);
          gestureAnim.setValue(easedProgress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Use the tracked value and include velocity for better feel
        const velocity = gestureState.vy; // Vertical velocity of gesture
        
        // Determine if we should close based on:
        // 1. Enough distance scrolled (above threshold)
        // 2. OR enough scrolling with sufficient velocity
        const shouldClose = 
          currentGestureValue.current > minCloseThreshold || // Scrolled enough
          (currentGestureValue.current > 0.2 && velocity > minVelocity); // Or medium scroll with good velocity
        
        if (shouldClose) {
          // Animate the rest of the way to closed with timing
          Animated.timing(gestureAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          // Otherwise reset the gesture animation with a bounce
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
  
  // Animation effects for opening
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      gestureAnim.setValue(0);
      // Reset to zero first
      expandAnim.setValue(0);
      // Then animate to full scale
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      // When hiding, reset the animation completion state
      setAnimationComplete(false);
    }
  }, [isVisible, expandAnim, gestureAnim]);
  
  // Function to handle close button press with animation
  const handleClosePress = () => {
    // Animate closing
    Animated.parallel([
      // Animate gesture progress to 1 (fully closed)
      Animated.timing(gestureAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Simultaneously animate expand to 0 for a more dramatic effect
      Animated.timing(expandAnim, {
        toValue: 0.5, // Don't go all the way to 0 since gestureAnim handles part of it
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      // Call the onClose callback when animation is done
      onClose();
    });
  };
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  // Calculate the final scale with gesture adjustment
  // Start from 0.01 (almost invisible) to maxScale (full screen)
  // Adjust by gesture progress (1 - gesture) to shrink as user scrolls
  const baseScale = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.01, maxScale],
  });
  
  // Apply gesture effect to scale
  const finalScale = Animated.multiply(
    baseScale,
    Animated.subtract(1, gestureAnim)
  );
  
  // Calculate opacity (fade out with gesture)
  const opacity = Animated.multiply(
    expandAnim,
    Animated.subtract(1, gestureAnim)
  );
  
  // Close button opacity - only show when overlay is fully expanded
  const closeButtonOpacity = expandAnim.interpolate({
    inputRange: [0.9, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  // Content opacity animation - fades out more quickly with gesture
  // This will make content disappear faster than the background
  const contentOpacity = Animated.add(
    // Base opacity from expand animation
    expandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    // Subtract gesture progress with higher weight to fade more quickly
    gestureAnim.interpolate({
      inputRange: [0, 0.3, 1],  // Adjust the middle point for faster fade
      outputRange: [0, -0.7, -1], // Stronger negative effect (-0.7 at just 30% scroll)
      extrapolate: 'clamp'
    })
  );
  
  return (
    <View 
      style={styles.container} 
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.expandingCircle,
          {
            backgroundColor,
            opacity, // Keep original opacity for background
            transform: [{ scale: finalScale }],
          }
        ]}
      />
      
      {/* Content container with faster fading */}
      {isVisible && (
        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: contentOpacity, // Apply the faster fading opacity
            }
          ]}
          pointerEvents="box-none"
        >
          {/* Timer Circle Component */}
          <TimerCircle onBrushedPress={onClose} />
        </Animated.View>
      )}
      
      {/* Song Menu */}
      {isVisible && <SongMenu opacity={contentOpacity} />}
      
      {/* Close Button in top right corner */}
      {isVisible && (
        <Animated.View 
          style={[
            styles.closeButtonContainer, 
            { 
              opacity: contentOpacity, // Use content opacity for button too
              top: insets.top + 10 // Reduced from 20 to 10 to move it higher
            }
          ]}
          pointerEvents="box-none"
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
        </Animated.View>
      )}
      
      {/* Overlay area for gestures and taps */}
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