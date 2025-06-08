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
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';

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
  
  // Timer state - lifted up from TimerCircle
  const [isRunning, setIsRunning] = useState(false);
  const [minutes, setMinutes] = useState(2); // Standard 2 minutes
  const [seconds, setSeconds] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isOvertime, setIsOvertime] = useState(false);
  const [overtimeCounter, setOvertimeCounter] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | number | null>(null);
  const initialTimeInSeconds = useRef(2 * 60);
  
  // Get safe area insets for proper positioning
  const insets = useSafeAreaInsets();
  
  // Get theme color - use the same color as LightContainer
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';
  const successSoundPlayer = useAudioPlayer(require('../../assets/sounds/success.mp3'));
  
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
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setIsRunning(false); // Stop timer when closing
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
      // When the overlay becomes visible, reset the timer to its initial state
      // This ensures a fresh start every time, unless we want to preserve state across closes
      resetTimer(false); // Reset without haptics
      
      // Animation and state resets for when overlay becomes visible
      setAnimationComplete(true);
      gestureAnim.setValue(0); // Reset gesture animation
      transitioningContentOpacity.setValue(1);
      setIsInteractionActive(true);
      expandAnim.setValue(0); // Reset to zero first
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
    setIsRunning(false); // Stop timer
    setIsInteractionActive(true); // Interaction starts with button press
    // Ensure gestureAnim is at 0 if the button is pressed directly,
    // so it doesn't interfere with expandAnim driving the main fade-out.
    gestureAnim.setValue(0);

    // Animate expandAnim to 0 to mirror the opening animation
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(expandAnim, {
      toValue: 0, // Animate fully to 0
      duration: 300, // Was 400ms
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      onClose(); // Call the onClose callback when animation is done
    });
  };
  
  // Timer logic, moved from TimerCircle
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (isOvertime) {
          // Overtime counting logic
          setOvertimeCounter(c => {
            const newCount = c + 1;
            // Stop at 3 minutes of overtime (5 minutes total)
            if (newCount >= 180) {
              setIsRunning(false);
            }
            return newCount;
          });
        } else {
          // Normal countdown logic
          setSeconds(s => {
            if (s > 0) return s - 1;
            
            setMinutes(m => {
              if (m > 0) return m - 1;

              // Timer reaches 00:00 - Goal Met
              setHasCompleted(true);
              triggerCompletionHaptics();
              playSound();
              setIsOvertime(true); // Switch to overtime mode
              // Do NOT set isRunning to false here, let it keep running
              return 0;
            });
            
            return 59; // Reset seconds to 59 when minute ticks over
          });
        }
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, isOvertime]); // Add isOvertime to dependency array

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
      // This is a "Restart" action
      resetTimer();
    } else {
      // This is a "Start" action
      if (hasCompleted) {
        // If starting after a full run, reset completely first
        resetTimer(false); 
      }
      setIsRunning(true);
    }
  };
  
  // Handler for the "Brushed/Done" button
  const handleBrushedPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      // If timer is running, this is "Done"
      resetTimer(false); // Stop and reset
      handleInitiateNavigateToResults();
    } else {
      // If timer is not running, this is "Brushed"
      // We can decide what this should do - for now, let's just navigate
      handleInitiateNavigateToResults();
    }
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