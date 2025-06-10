import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Text, Dimensions, Modal, FlatList } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
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

const { width: screenWidth } = Dimensions.get('window');
const NUBO_TONE_KEY = 'nubo_tone';

// Mascot tone interface
interface MascotTone {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  
  // Animation values
  const translateX = useSharedValue(screenWidth);
  const opacity = useSharedValue(0);
  
  // Language selection state
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'en');
  
  // Mascot tone selection state
  const [isToneModalVisible, setIsToneModalVisible] = useState(false);
  const [currentTone, setCurrentTone] = useState<MascotTone | null>(null);
  
  // Mascot tone options
  const TONE_OPTIONS: MascotTone[] = [
    { 
      id: 'supportive', 
      label: t('onboarding.nuboToneScreen.options.supportive_label', 'Supportive'), 
      description: t('onboarding.nuboToneScreen.options.supportive_description', 'Gentle and helpful'),
      icon: 'heart-outline'
    },
    { 
      id: 'playful', 
      label: t('onboarding.nuboToneScreen.options.playful_label', 'Playful'), 
      description: t('onboarding.nuboToneScreen.options.playful_description', 'Fun and encouraging'),
      icon: 'happy-outline'
    },
    { 
      id: 'cool', 
      label: t('onboarding.nuboToneScreen.options.cool_label', 'Cool'), 
      description: t('onboarding.nuboToneScreen.options.cool_description', 'Confident and direct'),
      icon: 'sunglasses-outline'
    },
    { 
      id: 'wise', 
      label: t('onboarding.nuboToneScreen.options.wise_label', 'Wise'), 
      description: t('onboarding.nuboToneScreen.options.wise_description', 'Insightful and calm'),
      icon: 'library-outline'
    }
  ];
  
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
  }, []);
  
  useEffect(() => {
    // Update current language when i18n language changes
    setCurrentLanguage(i18n.language);
  }, [i18n.language]);
  
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
            await OnboardingService.resetOnboardingStatus();
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
  
  const handleLanguageSelect = async (langCode: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await i18n.changeLanguage(langCode);
      setCurrentLanguage(langCode);
      setIsLanguageModalVisible(false);
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
      setIsToneModalVisible(false);
    } catch (error) {
      console.error('Error changing mascot tone:', error);
      Alert.alert(
        t('settings.mascotTone.error.title', 'Tone Error'),
        t('settings.mascotTone.error.message', 'Failed to change mascot tone. Please try again.')
      );
    }
  };
  
  const getCurrentLanguageName = () => {
    const language = LANGUAGES.find(lang => lang.code === currentLanguage);
    return language ? t(`languages.${language.code}`, language.name) : t('languages.en', 'English');
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
        styles.toneModalItem,
        {
          backgroundColor: currentTone?.id === tone.id 
            ? 'rgba(0, 100, 255, 0.3)' 
            : 'rgba(255, 255, 255, 0.1)'
        }
      ]}
    >
      <Ionicons 
        name={tone.icon as any} 
        size={28} 
        color={currentTone?.id === tone.id ? 'white' : activeColors.tint} 
        style={styles.toneModalIcon}
      />
      <View style={styles.toneModalTextContainer}>
        <ThemedText style={[
          styles.toneModalTitle,
          {
            color: currentTone?.id === tone.id ? 'white' : activeColors.text
          }
        ]}>
          {tone.label}
        </ThemedText>
        <ThemedText style={[
          styles.toneModalDescription,
          {
            color: currentTone?.id === tone.id ? 'rgba(255,255,255,0.8)' : activeColors.textSecondary
          }
        ]}>
          {tone.description}
        </ThemedText>
      </View>
      {currentTone?.id === tone.id && (
        <Ionicons name="checkmark" size={24} color="white" style={styles.checkmarkIcon} />
      )}
    </Pressable>
  );
  
  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        
        <View style={[styles.header, { top: insets.top, paddingHorizontal: spacing.md }]}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={activeColors.text} />
          </Pressable>
          <Text style={styles.headerText}>{t('settings.name', 'settings')}</Text>
          <View style={styles.backButton} />
        </View>
        
        <ScrollView 
          style={{ flex: 1, marginTop: 60 + insets.top }}
          contentContainerStyle={{ 
            paddingTop: spacing.lg,
            paddingBottom: spacing.lg,
            alignItems: 'center'
          }}
        >
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
            
            <Pressable style={styles.settingItem}>
              <View style={styles.settingContent}>
                <Ionicons name="moon-outline" size={24} color={activeColors.tint} />
                <ThemedText style={styles.settingText}>
                  {t('settings.theme.name', 'App Theme')}
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
          
          <View style={{ height: spacing.md }} />
          
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
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  headerText: {
    fontSize: 32,
    color: 'white',
    letterSpacing: 1.6,
    textAlign: 'center',
    fontFamily: 'Merienda-Medium',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  toneModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toneModalIcon: {
    marginRight: 16,
  },
  toneModalTextContainer: {
    flex: 1,
  },
  toneModalTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Bold',
  },
  toneModalDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
}); 