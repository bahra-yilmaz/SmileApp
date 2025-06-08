/**
 * Empty overlay component with expanding animation from action button.
 * Closes simultaneously with scrolling gesture.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  Easing,
  GestureResponderEvent,
  useWindowDimensions
} from 'react-native';
import { useTheme } from '../ThemeProvider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimerCircle from './TimerCircle';
import SongMenu from './SongMenu';

interface OverlayProps {
  isVisible: boolean;
  onClose: () => void;
  onNavigateToResults: () => void;
}

export const TimerOverlay: React.FC<OverlayProps> = ({ isVisible, onClose, onNavigateToResults }) => {
  // Animation values - Use useState with lazy initializer for React 19 compatibility
  const [expandAnim] = useState(() => new Animated.Value(0));
  const [gestureAnim] = useState(() => new Animated.Value(0));
  const [transitioningContentOpacity] = useState(() => new Animated.Value(1));
  
  // Track animation completion and current gesture value
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isInteractionActive, setIsInteractionActive] = useState(false);
  const currentGestureMaxDy = useRef(0); // To store max dy during the current gesture
  
  // Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // Get theme color - use the same color as LightContainer
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  
  // Get screen dimensions using the hook for dynamic updates
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  
  // Calculate the maximum scale needed to cover the screen from a small circle
  const buttonSize = 70; // Size of the action button
  const maxScale = Math.max(screenWidth, screenHeight) * 2 / buttonSize;
  
  // Closure thresholds (now apply to raw scroll progress within sensitive area)
  const minCloseThreshold = 0.07; // Raw scroll progress for slow drags (~7%). Was eased progress with pow(1.1).
  const minVelocity = 0.5; // Minimum velocity to consider for quick flick gestures
  const velocityAssistedCloseThreshold = 0.04; // Raw scroll progress for flicks (~4%).
  
  // Configure pan responder for scrolling gesture - React 19 compatible
  const [panResponder] = useState(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: (_, gestureState) => {
        return gestureState.dy > 1 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 1.5);
      },
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        gestureAnim.setValue(0); // Restore this reset for visual consistency
        gestureAnim.stopAnimation();
        expandAnim.stopAnimation();
        setIsInteractionActive(true);
        currentGestureMaxDy.current = 0; // Reset max dy for the new gesture
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          currentGestureMaxDy.current = Math.max(currentGestureMaxDy.current, gestureState.dy); // Track max dy
          const gestureProgress = Math.min(1, gestureState.dy / (screenHeight * 0.25));
          const easedProgress = Math.pow(gestureProgress, 1.0);
          gestureAnim.setValue(easedProgress);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy; // Vertical velocity of gesture
        const finalSwipeDy = currentGestureMaxDy.current; // Use the max dy recorded during move

        const gestureProgressAtRelease = Math.min(1, finalSwipeDy / (screenHeight * 0.25));
        const easedProgressAtRelease = gestureProgressAtRelease; // Linear progress
        
        const shouldClose = 
          easedProgressAtRelease > minCloseThreshold || 
          (easedProgressAtRelease > velocityAssistedCloseThreshold && velocity > minVelocity);
        
        if (shouldClose) {
          Animated.parallel([
            Animated.timing(expandAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(gestureAnim, {
              toValue: 0,
              duration: 300,
              easing: Easing.linear,
              useNativeDriver: true,
            })
          ]).start(() => {
            onClose();
          });
        } else {
          Animated.spring(gestureAnim, {
            toValue: 0,
            friction: 5,
            tension: 40,
            useNativeDriver: true,
          }).start(() => {
            setIsInteractionActive(false);
          });
        }
      }
    })
  );
  
  useEffect(() => {
    if (isVisible) {
      // Animation and state resets for when overlay becomes visible
      setAnimationComplete(true);
      gestureAnim.setValue(0); // Reset gesture animation
      transitioningContentOpacity.setValue(1);
      setIsInteractionActive(true);
      expandAnim.setValue(0); // Reset to zero first
      Animated.timing(expandAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setIsInteractionActive(false);
      });
    } else {
      setAnimationComplete(false);
      setIsInteractionActive(false);
    }
    // Restore original dependencies, removing screenHeight, screenWidth if not strictly needed for THIS effect
  }, [isVisible, expandAnim, gestureAnim, transitioningContentOpacity, onClose /* ensure all actual dependencies are listed if any logic using them remains in this effect */]);
  
  // Function to handle close button press with animation
  const handleClosePress = () => {
    setIsInteractionActive(true); // Interaction starts with button press
    // Ensure gestureAnim is at 0 if the button is pressed directly,
    // so it doesn't interfere with expandAnim driving the main fade-out.
    gestureAnim.setValue(0);

    // Animate expandAnim to 0 to mirror the opening animation
    Animated.timing(expandAnim, {
      toValue: 0, // Animate fully to 0
      duration: 300, // Was 400ms
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      onClose(); // Call the onClose callback when animation is done
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
  const baseContentOpacity = Animated.add(
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
  
  // Multiply base content opacity with the transitioning opacity
  const finalContentOpacity = Animated.multiply(baseContentOpacity, transitioningContentOpacity);

  // Handler to initiate navigation: immediate navigation for React 19 compatibility
  const handleInitiateNavigateToResults = () => {
    // Fade out content
    Animated.timing(transitioningContentOpacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    // Navigate immediately instead of waiting for animation
    onNavigateToResults();
  };

  return (
    <View 
      style={styles.container} 
      pointerEvents={isVisible ? 'auto' : 'none'}
      {...(isVisible ? panResponder.panHandlers : {})} // Apply panHandlers from ref
    >
      <Animated.View
        style={[
          styles.expandingCircle,
          {
            backgroundColor, // Restore original background color
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
              opacity: finalContentOpacity, // Apply the combined final content opacity
            }
          ]}
          pointerEvents="box-none"
        >
          {/* Timer Circle Component */}
          <TimerCircle onBrushedPress={handleInitiateNavigateToResults} />
        </Animated.View>
      )}
      
      {/* Song Menu */}
      {isVisible && <SongMenu opacity={finalContentOpacity} />}
      
      {/* Close Button in top right corner */}
      {isVisible && (
        <Animated.View 
          style={[
            styles.closeButtonContainer, 
            { 
              opacity: finalContentOpacity, // Use final combined content opacity for button too
              top: insets.top + 10 // Reduced from 20 to 10 to move it higher
            }
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            disabled={isInteractionActive} // Disable Pressable based on interaction state
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
      
      {/* Overlay area for gestures and taps - This View will be removed */}
      {/* {isVisible && (
        <View 
          style={styles.touchableArea}
          {...panResponder.panHandlers}
        />
      )} */}
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