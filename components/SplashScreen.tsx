import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Animated, Dimensions } from 'react-native';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  // Animation value for fade out effect
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  // Track if the image has loaded successfully
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Handle image load success
  const handleImageLoad = () => {
    setImageLoaded(true);
    // Start the fade out animation immediately
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400, // Faster fade out (was 800ms)
      useNativeDriver: true,
    }).start(() => {
      // Call the onFinish callback when animation completes
      onFinish();
    });
  };
  
  // Start a timeout to ensure the splash screen doesn't hang indefinitely
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!imageLoaded) {
        console.log("Splash image load timeout - forcing completion");
        handleImageLoad();
      }
    }, 1500); // Shorter timeout (was 3000ms)
    
    return () => clearTimeout(timer);
  }, [imageLoaded]);
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Fallback background color in case image is slow to load */}
      <View style={styles.fallbackBackground} />
      
      {/* Splash screen image - ensure it covers the entire screen */}
      <Image 
        source={require('../assets/images/splash-screen.png')}
        style={styles.splashImage}
        resizeMode="cover"
        onLoad={handleImageLoad}
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