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
import ConfirmModal from '../../components/modals/ConfirmModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Easing } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { OnboardingService } from '../../services/OnboardingService';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useDashboardData } from '../../hooks/useDashboardData';
import { eventBus } from '../../utils/EventBus';

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
  const { user } = useAuth();
  
  // Fetch dashboard data from backend
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError, refetch } = useDashboardData();
  
  // Local state to temporarily override the streak from the server
  const [overrideStreak, setOverrideStreak] = useState<number | null>(null);
  
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
  
  // ---------------------------------------------------------------------------
  // First-visit prompt & FAB highlight
  // ---------------------------------------------------------------------------
  const [showFirstTimerPrompt, setShowFirstTimerPrompt] = useState(false);

  // Determine if we should show modal on first interaction
  const [awaitingFirstTap, setAwaitingFirstTap] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hasShown = await AsyncStorage.getItem(FIRST_TIMER_SHOWN_KEY);
        if (!hasShown) {
          setAwaitingFirstTap(true);
          console.log('🎯 First visit to home screen. The "first brush" modal will show on tap.');
        }
      } catch (err) {
        console.warn('Error checking first visit flag', err);
      }
    })();
  }, []); // Run only once

  const handleFirstTap = () => {
    if (awaitingFirstTap) {
      setShowFirstTimerPrompt(true);
      setAwaitingFirstTap(false);
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
  
  // FAB breathing animation
  const fabAnim = React.useRef(new Animated.Value(0)).current; // 0..1 for breathing
  const pressAnim = React.useRef(new Animated.Value(1)).current; // For press effect
  const fabLoopRef = React.useRef<Animated.CompositeAnimation | null>(null);

  const fabAnimatedStyle = {
    transform: [
      { scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
      { scale: pressAnim }
    ],
    shadowOpacity: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] }),
    shadowRadius: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 16] }),
    shadowColor: showFirstTimerPrompt ? 'white' : '#000',
  } as any;

  useEffect(() => {
    if (showFirstTimerPrompt) {
      // Start breathing animation
      fabLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(fabAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
          Animated.timing(fabAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        ])
      );
      fabLoopRef.current.start();
    } else {
      if (fabLoopRef.current) fabLoopRef.current.stop();
      fabAnim.setValue(0);
    }

    return () => {
      if (fabLoopRef.current) fabLoopRef.current.stop();
    };
  }, [showFirstTimerPrompt, fabAnim]);

  // A new function to handle the FAB animation and navigation
  const triggerFabAndNavigate = () => {
    // Animate the FAB press
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.9, duration: 150, useNativeDriver: false }),
      Animated.timing(pressAnim, { toValue: 1, duration: 200, useNativeDriver: false })
    ]).start();

    // Navigate after the animation is done
    setTimeout(() => {
      router.push('./timer');
    }, 400);
  };
  
  // Handle menu button press
  const handleMenuPress = () => router.push('/(home)/settings');
  
  // Toggle home mascot card expansion
  const toggleHomeMascotExpansion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsHomeMascotExpanded(!isHomeMascotExpanded);
  };

  // Refresh dashboard data when returning from timer or other screens
  useEffect(() => {
    const unsubscribeCompleted = eventBus.on('brushing-completed', (payload?: { dailyStreak: number }) => {
      if (payload && typeof payload.dailyStreak === 'number') {
        setOverrideStreak(payload.dailyStreak);
      }
      refetch();
    });

    const unsubscribeReverted = eventBus.on('brushing-reverted', () => {
      setOverrideStreak(null); // Clear override on revert
      refetch();
    });

    const unsubscribeFrequency = eventBus.on('frequency-updated', () => {
      refetch();
    });

    return () => {
      unsubscribeCompleted();
      unsubscribeReverted();
      unsubscribeFrequency();
    };
  }, [refetch]);

  // Check if user needs a first brush created (for existing users without toothbrushes)
  useEffect(() => {
    const ensureFirstBrushExists = async () => {
      if (!user?.id || user.id === 'guest') return;

      try {
        const { ToothbrushService } = await import('../../services/toothbrush');
        await ToothbrushService.createFirstBrushForNewUser(user.id, t);
      } catch (error) {
        console.error('❌ Error ensuring first brush exists:', error);
        // Don't show error to user - this is a background operation
      }
    };

    ensureFirstBrushExists();
  }, [user?.id, t]);
  
  const introOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(introOpacity, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }).start();
  }, []);

  const screenContent = (
    <>
      <Image 
        source={AppImages.homescreenBackground}
        style={styles.homeBackgroundImage}
        contentFit="cover"
        cachePolicy="disk"
        transition={600}
      />
      <View style={{ flex: 1 }} >
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
              greetingTextKey={selectedMascotConfig.greetingTextKey}
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
              <StreakCard 
                streakDays={overrideStreak ?? dashboardData?.streakDays ?? 0} 
                fontFamily={fontFamily} 
                onPress={() => setIsStreakVisible(true)} 
              />
              <BrushingTimeCard 
                minutes={dashboardData?.averageLast10Brushings?.minutes ?? 0} 
                seconds={dashboardData?.averageLast10Brushings?.seconds ?? 0} 
                fontFamily={fontFamily} 
                onPress={() => setIsBrushingTimeVisible(true)} 
              />
              <ToothbrushCard 
                fontFamily={fontFamily} 
                onPress={() => setIsToothbrushVisible(true)} 
              />
              <View style={styles.spacer} />
              <CalendarView 
                selectedDate={selectedDate} 
                onDateChange={setSelectedDate}
              />
            </LightContainer>
          </View>
        </View>
        <Animated.View style={[styles.fabContainer, { bottom: insets.bottom + 10 }, fabAnimatedStyle]}>
          <TouchableOpacity
            onPress={triggerFabAndNavigate}
            style={styles.fabButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.fabGradient}
            >
              <MaterialCommunityIcons name="tooth" size={36} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
          transition={600}
        />
        <ChatOverlay isVisible={isChatVisible} onClose={toggleChat} />
        <ToothbrushOverlay 
          isVisible={isToothbrushVisible} 
          onClose={() => setIsToothbrushVisible(false)} 
        />
        <StreakOverlay 
          isVisible={isStreakVisible} 
          onClose={() => setIsStreakVisible(false)}
          streakDays={overrideStreak ?? dashboardData?.streakDays ?? 0}
        />
        <BrushingTimeOverlay 
          isVisible={isBrushingTimeVisible}
          onClose={() => setIsBrushingTimeVisible(false)}
          minutes={dashboardData?.averageLast10Brushings?.minutes ?? 0}
          seconds={dashboardData?.averageLast10Brushings?.seconds ?? 0}
        />
      </View>
    </>
  );

  return (
    <Animated.View
      style={[styles.container, { opacity: introOpacity }]}
      onStartShouldSetResponderCapture={() => awaitingFirstTap}
      onResponderRelease={handleFirstTap}
    >
      <View
        style={[styles.container, { opacity: isOverlayVisible ? 0.6 : 1 }]}
        pointerEvents={isOverlayVisible ? 'none' : 'auto'}
      >
        {screenContent}
        
        {/* FAB to start brushing */}
        <Animated.View style={[styles.fabContainer, { bottom: insets.bottom + 10 }, fabAnimatedStyle]}>
          <TouchableOpacity
            onPress={triggerFabAndNavigate}
            style={styles.fabButton}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[600]]}
              style={styles.fabGradient}
            >
              <MaterialCommunityIcons name="tooth" size={36} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Overlays */}
      <ChatOverlay isVisible={isChatVisible} onClose={toggleChat} />
      <ToothbrushOverlay 
        isVisible={isToothbrushVisible} 
        onClose={() => setIsToothbrushVisible(false)} 
      />
      <StreakOverlay 
        isVisible={isStreakVisible} 
        onClose={() => setIsStreakVisible(false)} 
        streakDays={overrideStreak ?? dashboardData?.streakDays ?? 0} 
      />
      <BrushingTimeOverlay 
        isVisible={isBrushingTimeVisible} 
        onClose={() => setIsBrushingTimeVisible(false)} 
        minutes={dashboardData?.averageLast10Brushings?.minutes ?? 0} 
        seconds={dashboardData?.averageLast10Brushings?.seconds ?? 0} 
      />

      {/* First-time User Modal */}
      <ConfirmModal
        visible={showFirstTimerPrompt}
        icon={
          <MaterialCommunityIcons name="toothbrush" size={32} color={theme.colors.primary[500]} />
        }
        title={t('home.firstBrush.title', 'Ready for your first brush?')}
        message={undefined}
        confirmText={t('home.firstBrush.start', 'Start now')}
        cancelText={t('common.later', 'Later')}
        dimAmount={0.4}
        floatingElement={(
          <Animated.View style={[styles.fabCopy, { transform: [
            { scale: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
            { scale: pressAnim }
          ] }]} pointerEvents="none">
            <LinearGradient colors={[theme.colors.primary[500], theme.colors.primary[600]]} style={styles.gradientButton}>
              <MaterialCommunityIcons name="tooth" size={36} color="white" />
            </LinearGradient>
          </Animated.View>
        )}
        onConfirm={async () => {
          setShowFirstTimerPrompt(false);
          try {
            await AsyncStorage.setItem(FIRST_TIMER_SHOWN_KEY, 'true');
          } catch (err) {
            console.warn('Error saving first timer flag', err);
          }
          triggerFabAndNavigate();
        }}
        onCancel={async () => {
          setShowFirstTimerPrompt(false);
          try {
            await AsyncStorage.setItem(FIRST_TIMER_SHOWN_KEY, 'true');
          } catch (err) {
            console.warn('Error saving first timer flag', err);
          }
        }}
      />
    </Animated.View>
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
  fabContainer: {
    position: 'absolute',
    left: width / 2 - 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabCopy: {
    position: 'absolute',
    bottom: 45,
    left: width / 2 - 35,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
  },
});
