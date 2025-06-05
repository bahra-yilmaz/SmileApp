import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

// Define base and glow shadow properties for clarity and reusability
const BASE_SHADOW_OPACITY = 0.2; // Default shadow opacity from PrimaryButton
const GLOW_SHADOW_OPACITY = 0.5; // Enhanced shadow opacity for the glow effect
const BASE_SHADOW_RADIUS = 4;    // Default shadow radius from PrimaryButton
const GLOW_SHADOW_RADIUS = 10;   // Enhanced shadow radius for the glow effect

export const useButtonPulseAnimation = (isClickable: boolean) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // glowAnim: 0 represents base shadow, 1 represents peak glow
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const scaleUpAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  // Tracks if the button was previously unclickable and is now clickable, to trigger one-time animations
  const justBecameClickable = useRef(false);
  const prevIsClickableRef = useRef(isClickable); // Store initial clickable state

  useEffect(() => {
    // Determine if the button just transitioned to a clickable state
    if (isClickable && !prevIsClickableRef.current) {
      justBecameClickable.current = true;
    } else {
      justBecameClickable.current = false;
    }

    if (justBecameClickable.current) {
      // --- Start animations for "just became clickable" --- 
      // Stop any previous animations
      if (scaleUpAnimationRef.current) scaleUpAnimationRef.current.stop();
      if (pulseAnimationRef.current) pulseAnimationRef.current.stop();

      // 1. Scale-up with bounce animation
      scaleAnim.setValue(1);
      scaleUpAnimationRef.current = Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: false, 
      });
      scaleUpAnimationRef.current.start();

      // 2. Pulsing glow animation (3 times)
      glowAnim.setValue(0);
      pulseAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.delay(1300),
        ]),
        { iterations: 3 }
      );
      pulseAnimationRef.current.start(() => {
        glowAnim.setValue(0); // Reset glow after loop completes
      });

    } else if (!isClickable) {
      // --- Button is NOT clickable (or became unclickable) --- 
      // Stop all animations and reset to initial/disabled state
      if (scaleUpAnimationRef.current) scaleUpAnimationRef.current.stop();
      if (pulseAnimationRef.current) pulseAnimationRef.current.stop();
      
      Animated.timing(scaleAnim, { // Reset scale
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
      glowAnim.setValue(0); // Reset glow immediately
    }
    // If it was already clickable and animations have run, or it's not the specific transition, do nothing more.

    // Update previous clickable state for the next render
    prevIsClickableRef.current = isClickable;

    // Cleanup animations on unmount or if isClickable changes causing effect to re-run
    return () => {
      if (scaleUpAnimationRef.current) scaleUpAnimationRef.current.stop();
      if (pulseAnimationRef.current) pulseAnimationRef.current.stop();
    };
  }, [isClickable, scaleAnim, glowAnim]);

  // Styles to be returned by the hook
  const transformStyle = {
    transform: [{ scale: scaleAnim }],
  };

  const shadowStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [BASE_SHADOW_OPACITY, GLOW_SHADOW_OPACITY],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [BASE_SHADOW_RADIUS, GLOW_SHADOW_RADIUS],
    }),
    // shadowColor and shadowOffset will be taken from the component's existing styles
  };

  return { transformStyle, shadowStyle };
}; 