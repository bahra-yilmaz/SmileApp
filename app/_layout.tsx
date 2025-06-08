import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '../components/ThemeProvider';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { preventAutoHideAsync, hideAsync } from 'expo-splash-screen';
import SplashScreen from '../components/SplashScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import i18nInstance from '../services/i18n';
import { I18nextProvider } from 'react-i18next';
import { enableFreeze } from 'react-native-screens';

// Get dimensions for background
const { width, height } = Dimensions.get('window');

// Keep the native splash screen visible while we load fonts
preventAutoHideAsync().catch(() => {
  /* ignore error */
});

// Enable react-freeze for automatic screen state management
enableFreeze(true);

export default function RootLayout() {
  // State to track if splash screen should be shown
  const [showSplash, setShowSplash] = useState(true);
  
  // Load custom fonts
  const [fontsLoaded, error] = useFonts({
    // Load Merienda fonts
    'Merienda-Light': require('../assets/fonts/Merienda-Light.ttf'),
    'Merienda-Regular': require('../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Medium': require('../assets/fonts/Merienda-Medium.ttf'),
    'Merienda-Bold': require('../assets/fonts/Merienda-Bold.ttf'),
    // Load Quicksand fonts
    'Quicksand-Light': require('../assets/fonts/Quicksand-Light.ttf'),
    'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
    'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
    'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
  });

  const appReady = fontsLoaded || error;

  // Handle when assets loaded and splash can be hidden
  useEffect(() => {
    if (fontsLoaded || error) {
      // Fonts are loaded, hide the native splash screen
      hideAsync().catch(() => {
        /* ignore error */
      });
    }
  }, [fontsLoaded, error]);

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Global background image that stays persistent during navigation */}
      <Image 
        source={require('../assets/images/meshgradient-light-default.png')}
        style={styles.backgroundImage}
      />
      
      <I18nextProvider i18n={i18nInstance}>
        <ThemeProvider defaultColorScheme="light" defaultThemeVariation="default">
          <StatusBar style="auto" />
          <Slot />
          
          {/* Show custom splash screen until fonts are loaded, then trigger fade out */}
          {(showSplash || !appReady) && <SplashScreen onFinish={handleSplashFinish} />}
        </ThemeProvider>
      </I18nextProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: width,
    height: height,
    resizeMode: 'cover',
    left: 0,
    top: 0,
    zIndex: -1,
  },
});
