import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform, TouchableOpacity, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { getRandomMascotConfig } from '../../constants/mascotConfig';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { AppImages } from '../../utils/loadAssets';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import home components using barrel imports
import {
  ChatButton,
  ExpandableMascotCard,
  StreakCard,
  BrushingTimeCard,
  ToothbrushCard,
  CalendarView,
  ChatOverlay,
  ToothbrushOverlay,
  StreakOverlay,
  BrushingTimeOverlay
} from '../../components/home';

// Get dimensions for background
const { width, height } = Dimensions.get('window');

const FIRST_TIMER_SHOWN_KEY = 'first_timer_shown';

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  
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
  
  // State for toothbrush overlay visibility
  const [isToothbrushVisible, setIsToothbrushVisible] = useState(false);
  
  // State for streak overlay visibility
  const [isStreakVisible, setIsStreakVisible] = useState(false);
  
  // State for brushing time overlay visibility
  const [isBrushingTimeVisible, setIsBrushingTimeVisible] = useState(false);
  
  // State for home screen mascot card expansion
  const [isHomeMascotExpanded, setIsHomeMascotExpanded] = useState(false);
  
  // Check if this is the first visit after onboarding
  useEffect(() => {
    checkFirstVisit();
  }, []);
  
  const checkFirstVisit = async () => {
    try {
      const hasShownFirstTimer = await AsyncStorage.getItem(FIRST_TIMER_SHOWN_KEY);
      if (!hasShownFirstTimer) {
        // This is the first visit after onboarding, navigate to timer screen
        setTimeout(() => {
          router.push('./timer');
        }, 1000); // Small delay to let the screen settle
        
        // Mark that we've shown the first timer
        await AsyncStorage.setItem(FIRST_TIMER_SHOWN_KEY, 'true');
      }
    } catch (error) {
      console.error('Error checking first visit:', error);
    }
  };
  
  // A single state to track if any overlay is visible
  const isOverlayVisible = isChatVisible || isToothbrushVisible || isStreakVisible || isBrushingTimeVisible;

  // Calculate mountain height for responsive mascot positioning
  const mountainHeight = height * 0.4;

  // Get a random mascot and its positioning
  const [selectedMascotConfig, setSelectedMascotConfig] = useState(getRandomMascotConfig);
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });
  
  // Font to use for displayed values
  const fontFamily = fontsLoaded ? 'Merienda-Bold' : undefined;
  
  // Prepare the greeting text using the translation key
  const greeting = t(selectedMascotConfig.greetingTextKey, { defaultValue: selectedMascotConfig.greetingTextKey });
  
  // Toggle chat overlay visibility
  const toggleChat = () => setIsChatVisible(!isChatVisible);
  
  // Handle floating action button press
  const handleActionButtonPress = () => router.push('./timer');
  
  // Handle menu button press
  const handleMenuPress = () => router.push('/(home)/settings');
  
  // Toggle home mascot card expansion
  const toggleHomeMascotExpansion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsHomeMascotExpanded(!isHomeMascotExpanded);
  };
  
  const screenContent = (
    <>
      <Image 
        source={AppImages.homescreenBackground}
        style={styles.homeBackgroundImage}
        contentFit="cover"
        cachePolicy="disk"
      />
      <View style={styles.mainContainer}>
        <SafeAreaView style={styles.headerContainer}>
          <ChatButton hasUnreadMessages={hasUnreadMessages} onPress={toggleChat} />
          <HeaderLogo />
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
              <MaterialCommunityIcons name="menu" size={32} color="white" />
            </View>
          </Pressable>
        </SafeAreaView>
        <View style={styles.mascotContainer}>
          <ExpandableMascotCard 
            config={selectedMascotConfig}
            greetingText={greeting}
            isExpanded={isHomeMascotExpanded}
            onPress={toggleHomeMascotExpansion}
            onPressWhenExpanded={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setSelectedMascotConfig(getRandomMascotConfig());
              setIsHomeMascotExpanded(false);
            }}
            enablePulse={!isHomeMascotExpanded}
          />
        </View>
        <View style={styles.contentWrapper}>
          <LightContainer 
            style={{
              width: '100%',
              height: containerHeight,
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
              flex: 0,
              zIndex: 25,
            }}
          >
            <StreakCard streakDays={7} fontFamily={fontFamily} onPress={() => setIsStreakVisible(true)} />
            <BrushingTimeCard minutes={2} seconds={30} fontFamily={fontFamily} onPress={() => setIsBrushingTimeVisible(true)} />
            <ToothbrushCard daysInUse={45} fontFamily={fontFamily} onPress={() => setIsToothbrushVisible(true)} />
            <View style={styles.spacer} />
            <CalendarView selectedDate={selectedDate} onDateChange={setSelectedDate} />
          </LightContainer>
        </View>
      </View>
      <TouchableOpacity style={styles.floatingActionButton} onPress={handleActionButtonPress} activeOpacity={0.8}>
        <LinearGradient colors={[theme.colors.primary[500], theme.colors.primary[600]]} style={styles.gradientButton}>
          <MaterialCommunityIcons name="tooth" size={36} color="white" />
        </LinearGradient>
      </TouchableOpacity>
      <View style={[styles.bottomLeftMascot, { bottom: mountainHeight * 0.25 }]}>
        <View style={styles.mascotCard}>
          <BlurView intensity={70} tint="light" style={styles.cardBlur}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '70%' }]} />
            </View>
          </BlurView>
        </View>
        <Image 
          source={AppImages['nubo-bag-1']} 
          style={styles.mascotImage} 
          contentFit="contain" 
          cachePolicy="disk" 
        />
      </View>
      <Image 
        source={AppImages.mountain1} 
        style={[styles.mountainImage, { bottom: -insets.bottom - 10 }]} 
        contentFit="contain" 
        cachePolicy="disk" 
      />
    </>
  );

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.container,
          {
            opacity: isOverlayVisible ? 0.6 : 1,
          }
        ]}
        pointerEvents={isOverlayVisible ? 'none' : 'auto'}
      >
        {screenContent}
      </Animated.View>
      
      {isOverlayVisible && (
        <>
          <ChatOverlay isVisible={isChatVisible} onClose={() => setIsChatVisible(false)} />
          <ToothbrushOverlay isVisible={isToothbrushVisible} onClose={() => setIsToothbrushVisible(false)} daysInUse={45} />
          <StreakOverlay isVisible={isStreakVisible} onClose={() => setIsStreakVisible(false)} streakDays={7} />
          <BrushingTimeOverlay isVisible={isBrushingTimeVisible} onClose={() => setIsBrushingTimeVisible(false)} minutes={2} seconds={30} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeBackgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 0,
  },
  mainContainer: {
    flex: 1,
    zIndex: 1,
    position: 'relative',
  },
  headerContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
  },
  mascotContainer: {
    position: 'absolute',
    top: 145,
    width: '100%',
    zIndex: 5,
    alignItems: 'center',
  },
  contentWrapper: {
    position: 'absolute',
    width: '100%',
    top: 200,
    marginTop: 100,
    zIndex: 20,
  },
  spacer: {
    height: 100,
  },
  bottomLeftMascot: {
    position: 'absolute',
    left: '5%',
    width: 100,
    height: 100,
    zIndex: 1001,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  menuButton: {
    position: 'absolute',
    right: 20,
    zIndex: 15,
  },
  menuIconContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mascotCard: {
    position: 'absolute',
    top: -25,
    left: 0,
    width: 100,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1002,
  },
  cardBlur: {
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(200, 200, 220, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
  },
  mountainImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: height * 0.4,
    zIndex: 20,
  },
  floatingActionButton: {
    position: 'absolute',
    bottom: 45,
    left: '50%',
    marginLeft: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
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
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
