import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Text, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import GlassmorphicHeader from '../../components/ui/GlassmorphicHeader';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import ReminderTimeManager from '../../components/ReminderTimeManager';
import { ReminderTime } from '../../components/ReminderItem';
import BrushingTargetSelector, { BrushingTarget } from '../../components/BrushingTargetSelector';
import DailyBrushingFrequencySelector, { DailyBrushingFrequency } from '../../components/DailyBrushingFrequencySelector';
import ToothbrushManager from '../../components/ToothbrushManager';
import { ToothbrushDisplayService } from '../../services/toothbrush/ToothbrushDisplayService';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { AppImages } from '../../utils/loadAssets';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LanguageItem } from '../../services/languageConfig';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import supabase from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { LanguageService } from '../../services/LanguageService';
import { useBrushingGoal } from '../../context/BrushingGoalContext';
import { eventBus } from '../../utils/EventBus';
import { 
  BrushingGoalsService, 
  TIME_TARGET_OPTIONS, 
  FREQUENCY_OPTIONS 
} from '../../services/BrushingGoalsService';
import { useToothbrushStats } from '../../hooks/useToothbrushStats';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const NUBO_TONE_KEY = 'nubo_tone';

// Mascot tone interface
interface MascotTone {
  id: string;
  label: string;
  description: string;
  icon?: string;
  image: any;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  
  // Use centralized brushing target options
  const TARGET_OPTIONS: BrushingTarget[] = TIME_TARGET_OPTIONS.map(option => ({
    ...option,
    label: t(option.label, option.label),
    description: t(option.description, option.description)
  }));
  
  // Use centralized frequency options  
  const FREQUENCY_OPTIONS_TRANSLATED: DailyBrushingFrequency[] = FREQUENCY_OPTIONS.map(option => ({
    ...option,
    label: t(option.label, option.label),
    description: t(option.description, option.description)
  }));
  
  // Animation values
  const translateX = useSharedValue(screenWidth);
  const opacity = useSharedValue(0);
  const scrollY = useSharedValue(0);
  
  // Language selection state
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
  
  // Mascot tone selection state
  const [isToneModalVisible, setIsToneModalVisible] = useState(false);
  const [currentTone, setCurrentTone] = useState<MascotTone | null>(null);
  
  // Brushing target selection state
  const [isTargetModalVisible, setIsTargetModalVisible] = useState(false);
  const [currentTarget, setCurrentTarget] = useState<BrushingTarget | null>(null);
  
  // Daily frequency selection state
  const [isFrequencyModalVisible, setIsFrequencyModalVisible] = useState(false);
  const [currentFrequency, setCurrentFrequency] = useState<DailyBrushingFrequency | null>(null);
  
  // Toothbrush management state
  const [isToothbrushModalVisible, setIsToothbrushModalVisible] = useState(false);
  
  // Reminder time selection state
  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<ReminderTime[]>([]);
  
  // Account state
  const [user, setUser] = useState<any | null>(null);
  
  // Mascot tone options
  const TONE_OPTIONS: MascotTone[] = [
    { 
      id: 'supportive', 
      label: t('onboarding.nuboToneScreen.options.supportive_label', 'Supportive'), 
      description: t('onboarding.nuboToneScreen.options.supportive_description', 'Gentle and helpful'),
      icon: 'heart-outline',
      image: require('../../assets/mascot/nubo-supportive-1.png')
    },
    { 
      id: 'playful', 
      label: t('onboarding.nuboToneScreen.options.playful_label', 'Playful'), 
      description: t('onboarding.nuboToneScreen.options.playful_description', 'Fun and encouraging'),
      icon: 'happy-outline',
      image: require('../../assets/mascot/nubo-playful-1.png')
    },
    { 
      id: 'cool', 
      label: t('onboarding.nuboToneScreen.options.cool_label', 'Cool'), 
      description: t('onboarding.nuboToneScreen.options.cool_description', 'Confident and direct'),
      icon: 'sunglasses-outline',
      image: require('../../assets/mascot/nubo-cool-5.png')
    },
    { 
      id: 'wise', 
      label: t('onboarding.nuboToneScreen.options.wise_label', 'Wise'), 
      description: t('onboarding.nuboToneScreen.options.wise_description', 'Insightful and calm'),
      icon: 'library-outline',
      image: require('../../assets/mascot/nubo-wise-5.png')
    }
  ];

  // After other account-related hooks
  const [isAccountExpanded, setIsAccountExpanded] = useState(false);

  const { user: authUser } = useAuth();
  const { 
    brushingGoalMinutes, 
    setBrushingGoalMinutes, 
    brushingFrequency, 
    setBrushingFrequency 
  } = useBrushingGoal();
  const { stats: toothbrushStats } = useToothbrushStats();

  useEffect(() => {
    // Animate in from the right
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    
    // Load current mascot tone
    loadCurrentTone();
    
    // For authenticated users, ensure context stays in sync with backend
    if (authUser?.id) {
      // Sync goals from database using centralized service
      BrushingGoalsService.syncFromDatabase(authUser.id).then(goals => {
        const matchingTarget = TARGET_OPTIONS.find(option => 
          Math.abs(option.minutes - goals.timeTargetMinutes) < 0.01
        );
        if (matchingTarget) {
          setCurrentTarget(matchingTarget);
        }
        
        const matchingFrequency = FREQUENCY_OPTIONS_TRANSLATED.find(option => 
          option.count === goals.dailyFrequency
        );
        if (matchingFrequency) {
          setCurrentFrequency(matchingFrequency);
        }
      }).catch(error => {
        console.error('Failed to sync goals in settings:', error);
      });
    }
  }, [authUser]);
  
  useEffect(() => {
    // Update current language when i18n language changes
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);
  
  useEffect(() => {
    // Fetch current auth user (if any)
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.warn('Unable to fetch user', err);
      }
    })();
  }, []);
  
  // Keep currentTarget in sync with context value
  useEffect(() => {
    const match = TARGET_OPTIONS.find(opt => opt.minutes === Math.round(brushingGoalMinutes * 60));
    if (match) {
      setCurrentTarget(match);
    }
  }, [brushingGoalMinutes]);
  
  // Keep currentFrequency in sync with context value
  useEffect(() => {
    const match = FREQUENCY_OPTIONS.find(opt => opt.count === brushingFrequency);
    if (match) {
      setCurrentFrequency(match);
    }
  }, [brushingFrequency]);
  
  const loadCurrentTone = async () => {
    try {
      const storedTone = await AsyncStorage.getItem(NUBO_TONE_KEY);
      if (storedTone) {
        const toneData = JSON.parse(storedTone);
        const tone = TONE_OPTIONS.find(option => option.id === toneData.id);
        if (tone) {
          setCurrentTone(tone);
        }
      } else {
        // Default to supportive if no tone is stored
        setCurrentTone(TONE_OPTIONS[0]);
      }
    } catch (error) {
      console.error('Error loading mascot tone:', error);
      setCurrentTone(TONE_OPTIONS[0]); // Default to supportive
    }
  };



  const getToothbrushAgeText = () => {
    // Follow same pattern as other settings - use meaningful fallback instead of loading indicator
    if (!toothbrushStats) {
      return t('toothbrush.age.brandNew', 'Brand new');
    }
    
    const displayData = ToothbrushDisplayService.getDisplayData(toothbrushStats, t);
    const { daysInUse } = displayData;
    const weeks = Math.floor(daysInUse / 7);
    const months = Math.floor(daysInUse / 30);

    if (months > 0) {
      return months === 1 
        ? t('toothbrush.age.oneMonth', { count: months }) 
        : t('toothbrush.age.months', { count: months });
    }
    if (weeks > 0) {
      return weeks === 1
        ? t('toothbrush.age.oneWeek', { count: weeks })
        : t('toothbrush.age.weeks', { count: weeks });
    }
    return daysInUse === 1
      ? t('toothbrush.age.oneDay', { count: daysInUse })
      : t('toothbrush.age.days', { count: daysInUse });
  };

  const handleBackPress = () => {
    // Animate out to the right
    translateX.value = withTiming(screenWidth, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    }, () => {
      runOnJS(router.back)();
    });
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    });
  };
  
  // Gesture handler for swipe-to-go-back
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // Only allow swiping to the right and only if gesture starts from left edge
      if (event.translationX > 0 && event.x < 50) {
        translateX.value = Math.max(0, event.translationX);
      }
    },
    onEnd: (event) => {
      // If user swiped more than 100 pixels to the right, trigger back navigation
      if (event.translationX > 100 && event.velocityX > 0) {
        runOnJS(handleBackPress)();
      } else {
        // Snap back to original position
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    },
  });
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
  const handleResetOnboarding = () => {
    Alert.alert(
      t('settings.resetOnboarding.title', 'Reset Onboarding'),
      t('settings.resetOnboarding.message', "Are you sure you want to reset the onboarding flow? You'll be redirected to the welcome screen."),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: "cancel"
        },
        {
          text: t('settings.resetOnboarding.confirm', 'Reset'),
          onPress: async () => {
            if (authUser?.id) {
              await OnboardingService.resetOnboardingStatus(authUser.id);
            }
            router.replace('/');
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleLanguagePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLanguageModalVisible(true);
  };
  
  // Generic modal close handler - can be used to make all modals auto-close or stay open
  const MODAL_AUTO_CLOSE = false; // Set to true if you want all modals to auto-close after selection
  
  const closeModalIfConfigured = (modalSetter: (visible: boolean) => void) => {
    if (MODAL_AUTO_CLOSE) {
      modalSetter(false);
    }
  };
  
  const handleLanguageSelect = async (langCode: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Use the centralized language service to handle changing and persisting the language
      await LanguageService.changeLanguage(langCode, authUser?.id);
      closeModalIfConfigured(setIsLanguageModalVisible);
    } catch (error) {
      console.error('Error changing language:', error);
      Alert.alert(
        t('settings.language.error.title', 'Language Error'),
        t('settings.language.error.message', 'Failed to change language. Please try again.')
      );
    }
  };
  
  const handleTonePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsToneModalVisible(true);
  };
  
  const handleToneSelect = async (tone: MascotTone) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const toneData = {
        id: tone.id,
        label: tone.label,
        description: tone.description
      };
      await AsyncStorage.setItem(NUBO_TONE_KEY, JSON.stringify(toneData));
      setCurrentTone(tone);
      closeModalIfConfigured(setIsToneModalVisible);
    } catch (error) {
      console.error('Error changing mascot tone:', error);
      Alert.alert(
        t('settings.mascotTone.error.title', 'Tone Error'),
        t('settings.mascotTone.error.message', 'Failed to change mascot tone. Please try again.')
      );
    }
  };

  const handleTargetPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTargetModalVisible(true);
  };

  const handleTargetUpdate = async (target: BrushingTarget) => {
    setCurrentTarget(target); // Optimistic UI update
    
    try {
      // Update via centralized service with user context
      await setBrushingGoalMinutes(target.minutes, { 
        userId: authUser?.id,
        source: 'user' 
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to update brushing target:', error);
      Alert.alert(
        t('settings.brushingTarget.error.title', 'Update Failed'),
        t('settings.brushingTarget.error.message', 'Could not save your brushing target. Please try again.')
      );
      
      // Revert optimistic UI update
      if (authUser?.id) {
        try {
          const goals = await BrushingGoalsService.getCurrentGoals();
          const revertTarget = TARGET_OPTIONS.find(option => 
            Math.abs(option.minutes - goals.timeTargetMinutes) < 0.01
          );
          if (revertTarget) {
            setCurrentTarget(revertTarget);
          }
        } catch (revertError) {
          console.error('Failed to revert target update:', revertError);
        }
      }
    }
    
    closeModalIfConfigured(setIsTargetModalVisible);
  };

  const handleFrequencyUpdate = async (frequency: DailyBrushingFrequency) => {
    setCurrentFrequency(frequency); // Optimistic UI update
    
    try {
      // Update via centralized service with user context
      await setBrushingFrequency(frequency.count, { 
        userId: authUser?.id,
        source: 'user' 
      });
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Notify other parts of app to refresh (e.g., HomeScreen streak calculations)
      eventBus.emit('frequency-updated');
    } catch (error) {
      console.error('Failed to update brushing frequency:', error);
      Alert.alert(
        t('settings.dailyFrequency.error.title', 'Update Failed'),
        t('settings.dailyFrequency.error.message', 'Could not save your brushing frequency. Please try again.')
      );
      
      // Revert optimistic UI update
      if (authUser?.id) {
        try {
          const goals = await BrushingGoalsService.getCurrentGoals();
          const revertFrequency = FREQUENCY_OPTIONS_TRANSLATED.find(option => 
            option.count === goals.dailyFrequency
          );
          if (revertFrequency) {
            setCurrentFrequency(revertFrequency);
          }
        } catch (revertError) {
          console.error('Failed to revert frequency update:', revertError);
        }
      }
    }

    closeModalIfConfigured(setIsFrequencyModalVisible);
  };

  const handleFrequencyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFrequencyModalVisible(true);
  };

  const handleToothbrushPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsToothbrushModalVisible(true);
  };
  
  const handleReminderPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsReminderModalVisible(true);
  };
  
  const getCurrentLanguageName = () => {
    const language = LANGUAGES.find(lang => lang.code === currentLanguage);
    return language ? t(`languages.${language.code}`, language.name) : t('languages.en', 'English');
  };
  
  const getEnabledRemindersText = () => {
    const enabledCount = reminderTimes.filter(time => time.enabled).length;
    if (enabledCount === 0) {
      return t('settings.reminderTimes.none', 'None set');
    } else if (enabledCount === 1) {
      return t('settings.reminderTimes.one', '1 reminder');
    } else {
      return t('settings.reminderTimes.multiple', { count: enabledCount });
    }
  };
  
  const handleAccountPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // If user is signed in, open a future account screen, otherwise redirect to sign-in
    if (user) {
      // Placeholder: navigate to future account details screen
      Alert.alert(t('settings.account.comingSoon', 'Account screen coming soon!'));
    } else {
      router.push('/onboarding/signin');
    }
  };
  
  const accountName = user?.user_metadata?.full_name || user?.email || t('settings.account.guest', 'Guest User');
  const accountEmail = user?.email || t('settings.account.signInPrompt', 'Tap to sign in');
  
  const handleAccountChevronPress = (e: any) => {
    e.stopPropagation();
    setIsAccountExpanded((prev) => !prev);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAccountExpanded(false);
      Alert.alert(t('settings.account.signedOut', 'Signed out successfully'));
    } catch (error) {
      Alert.alert(t('settings.account.error', 'Unable to sign out'));
    }
  };
  
  const handleSignInPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/onboarding/signin');
    setIsAccountExpanded(false);
  };

  const handleGetPremiumPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t('settings.account.premiumSoon', 'Premium Smile coming soon!'));
  };
  
  const renderLanguageItem = ({ item: lang }: { item: LanguageItem }) => (
    <Pressable
      key={lang.code}
      onPress={() => handleLanguageSelect(lang.code)}
      style={[
        styles.languageModalItem,
        {
          backgroundColor: currentLanguage === lang.code 
            ? 'rgba(0, 100, 255, 0.3)' 
            : 'rgba(255, 255, 255, 0.1)'
        }
      ]}
    >
      <Text style={styles.languageModalFlag}>{lang.flag}</Text>
      <ThemedText style={[
        styles.languageModalText,
        {
          color: currentLanguage === lang.code ? 'white' : activeColors.text
        }
      ]}>
        {t(`languages.${lang.code}`, lang.name)}
      </ThemedText>
      {currentLanguage === lang.code && (
        <Ionicons name="checkmark" size={24} color="white" style={styles.checkmarkIcon} />
      )}
    </Pressable>
  );
  
  const renderToneItem = ({ item: tone }: { item: MascotTone }) => (
    <Pressable
      key={tone.id}
      onPress={() => handleToneSelect(tone)}
              style={[
          styles.toneCard,
          { 
            borderColor: currentTone?.id === tone.id 
              ? activeColors.tint 
              : 'rgba(255, 255, 255, 0.3)',
            backgroundColor: currentTone?.id === tone.id 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)'
          }
        ]}
    >
      <View style={styles.toneCardContent}>
        <View style={styles.toneTextContainer}>
          <ThemedText style={[
            styles.toneCardTitle,
            {
              color: currentTone?.id === tone.id ? activeColors.tint : 'white'
            }
          ]}>
            {tone.label}
          </ThemedText>
          <ThemedText style={[
            styles.toneCardDescription,
            {
              color: currentTone?.id === tone.id ? activeColors.tint : 'white',
              opacity: currentTone?.id === tone.id ? 1 : 0.9
            }
          ]}>
            {tone.description}
          </ThemedText>
        </View>
        <ExpoImage 
          source={tone.image}
          style={styles.toneCardImage}
          resizeMode="contain"
        />
      </View>
    </Pressable>
  );

  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <ExpoImage 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 60 + insets.top + spacing.lg,
            paddingBottom: spacing.lg,
            }
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          <GlassmorphicCard style={styles.accountCard} width={screenWidth * 0.9}>
            <View>
              <Pressable style={styles.accountItem} onPress={handleAccountPress}>
                <Ionicons name="person-circle-outline" size={48} color={activeColors.tint} />
                <View style={styles.accountInfo}>
                  <ThemedText style={styles.accountName}>{accountName}</ThemedText>
                  {!user && (
                    <ThemedText style={styles.accountEmail}>{accountEmail}</ThemedText>
                  )}
                </View>
                <Pressable onPress={(e) => handleAccountChevronPress(e)} hitSlop={10}>
                  <Ionicons 
                    name={isAccountExpanded ? "chevron-down" : "chevron-forward"}
                    size={24} 
                    color={activeColors.textSecondary} 
                  />
                </Pressable>
              </Pressable>
              {isAccountExpanded && (
                <View style={styles.accountExpandedContent}>
                  {user ? (
                    <Pressable style={styles.expandedItem} onPress={handleSignOut}>
                      <Ionicons name="log-out-outline" size={22} color={activeColors.tint} />
                      <ThemedText style={styles.settingText}>{t('settings.account.signOut', 'Sign Out')}</ThemedText>
                    </Pressable>
                  ) : (
                    <>
                      <Pressable style={styles.expandedItem} onPress={handleSignInPress}>
                        <Ionicons name="log-in-outline" size={22} color={activeColors.tint} />
                        <ThemedText style={styles.settingText}>{t('settings.account.signIn', 'Sign in for personalized experience')}</ThemedText>
                      </Pressable>
                      <View style={styles.divider} />
                      <Pressable style={styles.expandedItem} onPress={handleGetPremiumPress}>
                        <Ionicons name="star-outline" size={22} color={activeColors.tint} />
                        <ThemedText style={styles.settingText}>{t('settings.account.getPremium', 'Get Premium Smile')}</ThemedText>
                      </Pressable>
                    </>
                  )}
                </View>
              )}
            </View>
          </GlassmorphicCard>
          <View style={{ height: spacing.sm }} />
          
          <GlassmorphicCard style={styles.settingsCard} width={screenWidth * 0.9}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              {t('settings.appSettings.title', 'App Settings')}
            </ThemedText>
            
            <Pressable 
              style={styles.settingItem}
              onPress={handleResetOnboarding}
            >
              <View style={styles.settingContent}>
                <Ionicons name="refresh-circle-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.resetOnboarding.name', 'Reset Onboarding')}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingItem} onPress={handleTonePress}>
              <View style={styles.settingContent}>
                <Ionicons name="person-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.mascotTone.name', 'Mascot Tone')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {currentTone?.label || t('onboarding.nuboToneScreen.options.supportive_label', 'Supportive')}
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingItem} onPress={handleLanguagePress}>
              <View style={styles.settingContent}>
                <Ionicons name="language-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.language.name', 'Language')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {getCurrentLanguageName()}
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
          </GlassmorphicCard>
          
          <View style={{ height: spacing.sm }} />
          
          <GlassmorphicCard style={styles.settingsCard} width={screenWidth * 0.9}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              {t('settings.brushingSettings.title', 'Brushing Settings')}
            </ThemedText>
            
            <Pressable style={styles.settingItem} onPress={handleReminderPress}>
              <View style={styles.settingContent}>
                <Ionicons name="notifications-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.brushingSettings.reminderTime', 'Reminder Time')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {getEnabledRemindersText()}
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingItem} onPress={handleFrequencyPress}>
              <View style={styles.settingContent}>
                <Ionicons name="calendar-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.brushingSettings.frequency', 'Brushing Frequency')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {currentFrequency 
                    ? t('settings.dailyFrequency.countFormat', { count: currentFrequency.count })
                    : t('settings.dailyFrequency.options.standard_short', '2 times')}
                </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingItem} onPress={handleTargetPress}>
              <View style={styles.settingContent}>
                <Ionicons name="stopwatch-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.brushingSettings.targetTime', 'Target Brushing Time')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {currentTarget?.label || t('settings.brushingTarget.options.standard_label', '2 minutes')}
                </ThemedText>
              <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
            
            <View style={styles.divider} />
            
            <Pressable style={styles.settingItem} onPress={handleToothbrushPress}>
              <View style={styles.settingContent}>
                <Ionicons name="brush-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.brushingSettings.toothbrush', 'Toothbrush Menu')}
                </ThemedText>
              </View>
              <View style={styles.languageInfo}>
                <ThemedText style={styles.currentLanguageText}>
                  {getToothbrushAgeText()}
                </ThemedText>
                <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
              </View>
            </Pressable>
          </GlassmorphicCard>
          
          <View style={{ height: spacing.sm }} />
          
          <GlassmorphicCard style={styles.settingsCard} width={screenWidth * 0.9}>
            <ThemedText variant="subtitle" style={styles.sectionTitle}>
              {t('settings.about.title', 'About')}
            </ThemedText>
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Ionicons name="information-circle-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.appVersion.name', 'App Version')}
                </ThemedText>
              </View>
              <ThemedText style={styles.versionText}>1.0.0</ThemedText>
            </Pressable>
          </GlassmorphicCard>
        </ScrollView>
        
        {/* Glassmorphic Header */}
        <GlassmorphicHeader
          title={t('settings.name', 'settings')}
          onBackPress={handleBackPress}
          textColor="white"
          scrollY={scrollY}
          fadeThreshold={30}
        />
        
        {/* Language Selection Modal */}
        <BottomSheetModal
          visible={isLanguageModalVisible}
          onClose={() => setIsLanguageModalVisible(false)}
          title={t('settings.language.selectTitle', 'Select Language')}
          data={LANGUAGES}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
        />
        
        {/* Mascot Tone Selection Modal */}
        <BottomSheetModal
          visible={isToneModalVisible}
          onClose={() => setIsToneModalVisible(false)}
          title={t('settings.mascotTone.selectTitle', 'Choose Nubo\'s Tone')}
          data={TONE_OPTIONS}
          renderItem={renderToneItem}
          keyExtractor={(item) => item.id}
        />

        {/* Brushing Target Selection Modal */}
        <BrushingTargetSelector
          visible={isTargetModalVisible}
          onClose={() => setIsTargetModalVisible(false)}
          onUpdate={handleTargetUpdate}
          autoClose={MODAL_AUTO_CLOSE}
          selectedId={currentTarget?.id}
        />

        {/* Daily Brushing Frequency Selection Modal */}
        <DailyBrushingFrequencySelector
          visible={isFrequencyModalVisible}
          onClose={() => setIsFrequencyModalVisible(false)}
          onUpdate={handleFrequencyUpdate}
          autoClose={MODAL_AUTO_CLOSE}
          selectedId={currentFrequency?.id}
        />

        {/* Toothbrush Management Modal */}
        <ToothbrushManager
          visible={isToothbrushModalVisible}
          onClose={() => setIsToothbrushModalVisible(false)}
          onUpdate={() => {
            // Refresh local data when toothbrush is updated
            console.log('🦷 Settings: Toothbrush updated, refreshing display...');
          }}
        />
        
        {/* Reminder Times Manager */}
        <ReminderTimeManager
          visible={isReminderModalVisible}
          onClose={() => setIsReminderModalVisible(false)}
          onUpdate={(reminders) => setReminderTimes(reminders)}
        />
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 0,
  },

  settingsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontFamily: 'Quicksand-Bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguageText: {
    opacity: 0.7,
    marginRight: 8,
    fontSize: 14,
  },
  versionText: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  // Modal Item Styles
  languageModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageModalFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageModalText: {
    flex: 1,
    fontSize: 16,
    color: 'white',
  },
  checkmarkIcon: {
    marginLeft: 8,
    fontWeight: 'bold',
  },
  // Tone Modal Styles
  // Tone Card Styles (matching NuboToneScreen)
  toneCard: {
    width: screenWidth * 0.85,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },
  toneCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneTextContainer: {
    flex: 1,
  },
  toneCardTitle: {
    fontSize: 18,
    marginBottom: 8,
    fontFamily: 'Quicksand-Bold',
  },
  toneCardDescription: {
    fontSize: 16,
  },
  toneCardImage: {
    width: 80,
    height: 80,
    marginLeft: 10,
    backgroundColor: 'transparent',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },

  accountCard: {
    padding: 20,
    marginBottom: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountInfo: {
    marginLeft: 16,
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  accountEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  accountExpandedContent: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150,150,150,0.2)',
  },
  expandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },

}); 