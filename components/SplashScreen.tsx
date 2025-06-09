import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
  isAppReady: boolean;
}

export default function SplashScreen({ onFinish, isAppReady }: SplashScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isAppReady) {
      // App is ready, start the fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        delay: 200, // A small delay to ensure the UI has a moment to settle
        useNativeDriver: true,
      }).start(() => {
        // Call the onFinish callback when animation completes to unmount the component
        onFinish();
      });
    }
  }, [isAppReady, onFinish, fadeAnim]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Fallback background color in case image is slow to load */}
      <View style={styles.fallbackBackground} />

      {/* Splash screen image - ensure it covers the entire screen */}
      <Image
        source={require('../assets/images/splash-screen.png')}
        style={styles.splashImage}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  fallbackBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
}); 