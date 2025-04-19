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
  ToothbrushCard,
  CalendarView,
  ChatOverlay
} from '../../components/home';

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions
  const { height: screenHeight } = Dimensions.get('window');
  // Calculate container height to fit all content
  const containerHeight = screenHeight * 0.85;
  
  // State for notification badge
  const [hasUnreadMessages] = useState(true);
  
  // State for selected date
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // State for chat overlay visibility
  const [isChatVisible, setIsChatVisible] = useState(false);
  
  // Get a random mascot and its positioning
  const { variant: randomMascotVariant, position: mascotPosition } = useRandomMascot();
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  // Font to use for displayed values
  const fontFamily = fontsLoaded ? 'Merienda-Bold' : undefined;
  
  // Toggle chat overlay visibility
  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Smile Header in safe area */}
        <SafeAreaView style={styles.headerContainer}>
          <HeaderLogo />
          <ChatButton 
            hasUnreadMessages={hasUnreadMessages}
            onPress={toggleChat}
          />
        </SafeAreaView>
        
        {/* Expandable Circular Glassmorphic Card - positioned just below header */}
        <View style={styles.mascotContainer}>
          <ExpandableMascotCard 
            mascotVariant={randomMascotVariant}
            mascotPosition={mascotPosition}
            greetingText="Hello World!"
          />
        </View>
        
        {/* Light Container positioned with top margin to create space below mascot */}
        <View style={styles.contentWrapper}>
          <LightContainer 
            style={{
              width: '100%',
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
            
            {/* Add medium spacer */}
            <View style={styles.spacer} />
            
            {/* Calendar View */}
            <CalendarView 
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
            />
          </LightContainer>
        </View>
        
        {/* Chat Overlay */}
        <ChatOverlay 
          isVisible={isChatVisible}
          onClose={() => setIsChatVisible(false)}
        />
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
  mascotContainer: {
    position: 'absolute',
    top: 0, // Position the mascot just below the header
    width: '100%',
    zIndex: 5,
  },
  contentWrapper: {
    position: 'absolute',
    width: '100%',
    top: 200, // Adjusted to accommodate new mascot position
    marginTop: 100, // Add 100px margin below mascot
    zIndex: 20,
  },
  spacer: {
    height: 100, // Reduced spacer height to bring calendar higher
  },
}); 