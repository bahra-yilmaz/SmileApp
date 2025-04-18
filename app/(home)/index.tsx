import React, { useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRandomMascot } from '../../utils/mascotUtils';

// Import home components using barrel imports
import {
  ChatButton,
  ExpandableMascotCard,
  StreakCard,
  BrushingTimeCard,
  ToothbrushCard
} from '../../components/home';

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions
  const { height: screenHeight } = Dimensions.get('window');
  // Calculate container height
  const containerHeight = screenHeight * 0.65;
  
  // State for notification badge
  const [hasUnreadMessages] = useState(true);
  
  // Get a random mascot and its positioning
  const { variant: randomMascotVariant, position: mascotPosition } = useRandomMascot();
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  // Font to use for displayed values
  const fontFamily = fontsLoaded ? 'Merienda-Bold' : undefined;
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Smile Header in safe area */}
        <SafeAreaView style={styles.headerContainer}>
          <HeaderLogo />
          <ChatButton hasUnreadMessages={hasUnreadMessages} />
        </SafeAreaView>
        
        {/* Expandable Circular Glassmorphic Card */}
        <ExpandableMascotCard 
          mascotVariant={randomMascotVariant}
          mascotPosition={mascotPosition}
          greetingText="Hello World!"
        />
        
        {/* Light Container positioned at the absolute bottom with fixed height */}
        <LightContainer 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: containerHeight,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
            flex: 0,
            zIndex: 25, // Keep it consistently above other elements
          }}
        >
          {/* Streak Days Card */}
          <StreakCard 
            streakDays={7} 
            fontFamily={fontFamily} 
          />
          
          {/* Average Brushing Time Card */}
          <BrushingTimeCard 
            minutes={2}
            seconds={30}
            fontFamily={fontFamily}
          />
          
          {/* Right Side Card (Toothbrush Card) */}
          <ToothbrushCard 
            daysInUse={45}
            fontFamily={fontFamily}
          />
        </LightContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  headerContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'center', // Center the logo
    alignItems: 'center',
  },
}); 