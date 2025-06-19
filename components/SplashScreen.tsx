import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HeaderLogo from './ui/HeaderLogo';

interface SplashScreenProps {
  onFinish: () => void;
  isAppReady: boolean;
  showHeader?: boolean;
  overlay?: boolean;
}

export default function SplashScreen({ onFinish, isAppReady, showHeader = false, overlay = false }: SplashScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const insets = useSafeAreaInsets();
  
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
  
  const containerStyles = overlay ? styles.overlayContainer : styles.container;
  const imageStyles = overlay ? styles.overlayImage : styles.splashImage;

  return (
    <Animated.View style={[containerStyles, { opacity: fadeAnim, bottom: overlay ? 0 : -insets.bottom }] }>
      {!overlay && <View style={styles.fallbackBackground} />}
      
      {showHeader && (
        <View style={styles.headerWrapper} pointerEvents="none">
          <HeaderLogo />
        </View>
      )}
      
      {/* Splash screen image - ensure it covers the entire screen */}
      <Image 
        source={require('../assets/images/splash-screen.png')}
        style={imageStyles}
        resizeMode={overlay ? 'contain' : 'cover'}
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
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  headerWrapper: {
    position: 'absolute',
    top: 40,
    width: '100%',
    alignItems: 'center',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayImage: {
    width: '60%',
    aspectRatio: 1,
  },
}); 