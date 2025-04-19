import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, Platform, TouchableOpacity, Pressable } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { useRandomMascot } from '../../utils/mascotUtils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

// Import home components using barrel imports
import {
  ChatButton,
  ExpandableMascotCard,
  StreakCard,
  BrushingTimeCard,
  ToothbrushCard,
  CalendarView,
  ChatOverlay,
  MenuOverlay,
  TimerOverlay
} from '../../components/home';

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
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
  
  // State for menu overlay visibility
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // State for timer overlay visibility
  const [isTimerVisible, setIsTimerVisible] = useState(false);
  
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
  
  // Handle floating action button press
  const handleActionButtonPress = () => {
    // Show timer overlay
    setIsTimerVisible(true);
  };
  
  // Handle user profile press
  const handleUserProfilePress = () => {
    router.push('/settings');
  };
  
  // Handle menu button press
  const handleMenuPress = () => {
    setIsMenuVisible(true);
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Smile Header in safe area */}
        <SafeAreaView style={styles.headerContainer}>
          <Pressable
            onPress={handleMenuPress}
            style={({ pressed }) => [
              styles.menuButton,
              {
                top: insets.top + 13,
                transform: [{ scale: pressed ? 0.95 : 1 }]
              }
            ]}
          >
            <View style={styles.menuIconContainer}>
              <MaterialCommunityIcons 
                name="menu" 
                size={32} 
                color="white" 
              />
            </View>
          </Pressable>
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
        
        {/* Menu Overlay */}
        <MenuOverlay
          isVisible={isMenuVisible}
          onClose={() => setIsMenuVisible(false)}
        />
        
        {/* Timer Overlay */}
        <TimerOverlay
          isVisible={isTimerVisible}
          onClose={() => setIsTimerVisible(false)}
        />
        
        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.floatingActionButton}
          onPress={handleActionButtonPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary[500], theme.colors.primary[600]]}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons name="tooth" size={36} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Bottom left mascot */}
      <View style={styles.bottomLeftMascot}>
        <Image 
          source={require('../../assets/mascot/nubo-bag-1.png')}
          style={styles.mascotImage}
          resizeMode="contain"
        />
      </View>

      {/* Bottom mountain image */}
      <View style={styles.bottomFixedContainer}>
        <Image 
          source={require('../../assets/images/mountain-1.png')} 
          style={{width: '100%', height: '100%'}}
          resizeMode="cover"
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
    justifyContent: 'space-between', // Changed to space-between
    alignItems: 'center',
    paddingHorizontal: 16, // Add horizontal padding
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
  bottomFixedContainer: {
    position: 'absolute',
    bottom: 0, // Reduced from 20px to 10px to move the image lower
    left: 0,
    right: 0,
    height: 280, // Increased height to show more of the top
    zIndex: 999, // Lowered z-index to allow floating button to be above
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 45,
    left: '50%',
    marginLeft: -35, // Half of width to center properly
    width: 70, // Slightly smaller
    height: 70, // Slightly smaller
    borderRadius: 35, // Half of width/height
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    borderRadius: 35, // Half of width/height
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomLeftMascot: {
    position: 'absolute',
    bottom: 55,
    left: 20,
    width: 80,
    height: 80,
    zIndex: 1001, // Higher than floating button (1000) to be at the very front
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  menuButton: {
    position: 'absolute',
    left: 20,
    zIndex: 15,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
