import { useRef } from 'react';
import { PanResponder, PanResponderInstance } from 'react-native';
import * as Haptics from 'expo-haptics';

interface UseSwipeUpGestureConfig {
  /** Callback fired when a successful upward swipe is detected */
  onSwipeUp: () => void;
  /** Minimum distance in pixels before considering it a swipe. Default: 50 */
  distanceThreshold?: number;
  /** Minimum upward velocity to instantly trigger. Default: 0.3 */
  velocityThreshold?: number;
  /** Whether to provide haptic feedback. Default: true */
  enableHaptics?: boolean;
}

interface UseSwipeUpGestureReturn {
  panResponder: PanResponderInstance;
}

export function useSwipeUpGesture({
  onSwipeUp,
  distanceThreshold = 50,
  velocityThreshold = 0.3,
  enableHaptics = true,
}: UseSwipeUpGestureConfig): UseSwipeUpGestureReturn {
  const hasTriggered = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Engage only if the movement is clearly upward and dominant vertically
        const isUpward = gestureState.dy < -10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
        return isUpward;
      },
      onPanResponderMove: () => {},
      onPanResponderRelease: (_, gestureState) => {
        const distanceTravelled = -gestureState.dy; // Upward distance positive
        const velocity = -gestureState.vy; // Upward velocity positive

        const meetsDistance = distanceTravelled > distanceThreshold;
        const meetsVelocity = velocity > velocityThreshold;

        if ((meetsDistance || meetsVelocity) && !hasTriggered.current) {
          hasTriggered.current = true;
          if (enableHaptics) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onSwipeUp();
          setTimeout(() => {
            // Reset after short delay to avoid multiple triggers in same gesture
            hasTriggered.current = false;
          }, 300);
        }
      },
    })
  ).current;

  return { panResponder };
} 