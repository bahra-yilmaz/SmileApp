import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { BlurView } from 'expo-blur';

interface CountdownProps {
  onCountdownFinish: () => void;
}

const Countdown: React.FC<CountdownProps> = ({ onCountdownFinish }) => {
  const { theme } = useTheme();
  const [count, setCount] = useState(3);
  const scaleAnim = new Animated.Value(0.5);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    const animate = (targetScale: number, targetOpacity: number) => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: targetScale,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: targetOpacity,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    };

    if (count > 0) {
      // Animate in
      animate(1, 1);

      const timer = setTimeout(() => {
        // Animate out before changing number
        animate(0.5, 0);
        
        const nextCountTimer = setTimeout(() => {
          setCount(c => c - 1);
        }, 200); // Brief pause before next number appears

        return () => clearTimeout(nextCountTimer);
      }, 800); // Hold the number for 800ms

      return () => clearTimeout(timer);
    } else {
      onCountdownFinish();
    }
  }, [count, onCountdownFinish, scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <BlurView
        intensity={20}
        tint={theme.colorScheme}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        }}
      >
        <Text style={[styles.countdownText, { color: '#FFFFFF' }]}>
          {count}
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: 'bold',
    fontFamily: 'Quicksand-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
});

export default Countdown; 