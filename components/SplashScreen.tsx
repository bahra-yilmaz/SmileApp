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
    // Start the fade out animation immediately after image is loaded
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Call the onFinish callback when animation completes
      onFinish();
    });
  };
  
  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Fallback background color in case image is slow to load */}
      <View style={styles.fallbackBackground} />
      
      {/* Just the splash logo image */}
      <Image 
        source={require('../assets/images/splash-logo.png')}
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