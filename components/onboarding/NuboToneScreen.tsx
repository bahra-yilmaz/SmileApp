import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions, Platform, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import PrimaryButton from '../ui/PrimaryButton';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';
import { useAuth } from '../../context/AuthContext';
import { OnboardingService, updateUserOnboarding } from '../../services/OnboardingService';
import { ToothbrushService } from '../../services/ToothbrushService';
import ConfirmModal from '../modals/ConfirmModal';

interface NuboToneScreenProps {
  nextScreenPath: string;
  index: number;
  totalScreens: number;
  isLastScreen?: boolean;
}

const { width } = Dimensions.get('window');

export default function NuboToneScreen({
  nextScreenPath,
  index,
  totalScreens,
  isLastScreen = false,
}: NuboToneScreenProps) {
  const { theme, colorScheme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  
  const [selectedTone, setSelectedTone] = useState<string>(onboardingData.mascot_tone || 'supportive');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isErrorModalVisible, setIsErrorModalVisible] = useState(false);

  const insets = useSafeAreaInsets();
  
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({}).current;

  const TONE_OPTIONS = useMemo(() => [
    { id: 'supportive', label: t('onboarding.nuboToneScreen.options.supportive_label'), description: t('onboarding.nuboToneScreen.options.supportive_description'), image: require('../../assets/mascot/nubo-supportive-1.png') },
    { id: 'playful', label: t('onboarding.nuboToneScreen.options.playful_label'), description: t('onboarding.nuboToneScreen.options.playful_description'), image: require('../../assets/mascot/nubo-playful-1.png') },
    { id: 'cool', label: t('onboarding.nuboToneScreen.options.cool_label'), description: t('onboarding.nuboToneScreen.options.cool_description'), image: require('../../assets/mascot/nubo-cool-5.png') },
    { id: 'wise', label: t('onboarding.nuboToneScreen.options.wise_label'), description: t('onboarding.nuboToneScreen.options.wise_description'), image: require('../../assets/mascot/nubo-wise-5.png') }
  ], [t]);

  // Initialize scale animations for each tone option
  TONE_OPTIONS.forEach(option => {
    if (!scaleAnims[option.id]) {
      scaleAnims[option.id] = new Animated.Value(option.id === selectedTone ? 1.25 : 1);
    }
  });

  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  
  const handleNext = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);

    if (!user) {
      setError("No user session found. Please sign in again.");
      setIsErrorModalVisible(true);
      setIsLoading(false);
      return;
    }
    
    // Update context one last time
    updateOnboardingData({ mascot_tone: selectedTone });

    // Combine context data with the final selection
    const finalOnboardingData = {
      ...onboardingData,
      mascot_tone: selectedTone,
    };

    console.log('Final Onboarding Data Payload:', JSON.stringify(finalOnboardingData, null, 2));

    try {
      await updateUserOnboarding(user.id, finalOnboardingData);
      
      // Mark onboarding as completed in local storage
      await OnboardingService.markOnboardingAsCompleted();
      
      // Initialize toothbrush data from the database after onboarding completion
      console.log('🦷 Initializing toothbrush data from onboarding...');
      await ToothbrushService.initializeFromDatabase(user.id);
      
      // Small delay to ensure database commit is complete before navigation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(home)');
      });
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsErrorModalVisible(true);
      setIsLoading(false);
    }
  };

  const handleSelectTone = (toneId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the previously selected card back to normal size
    if (selectedTone && selectedTone !== toneId && scaleAnims[selectedTone]) {
      Animated.timing(scaleAnims[selectedTone], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    // Animate the newly selected card to a larger size
    if (scaleAnims[toneId]) {
      Animated.timing(scaleAnims[toneId], {
        toValue: 1.25,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    setSelectedTone(toneId);
  };

  const headerHeight = insets.top + (Platform.OS === 'ios' ? 10 : 15) + 16 + 32;

  if (!fontsLoaded) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={[styles.progressContainer, { marginTop: headerHeight + 10 }]}>
          <View style={styles.indicators}>
            {Array(totalScreens).fill(0).map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.indicator,
                  { 
                    backgroundColor: i === index 
                      ? theme.colors.primary[600] 
                      : 'white',
                    width: i === index ? 24 : 8,
                    opacity: i === index ? 1 : 0.7
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={styles.questionContainer}>
            <ThemedText style={[
              styles.questionText,
              { fontFamily: 'Quicksand-Bold' }
            ]}>
              {t('onboarding.nuboToneScreen.question')}
            </ThemedText>
          </View>
        </View>
        
        <ScrollView 
          style={styles.cardsContainer}
          contentContainerStyle={styles.cardsContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {TONE_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={[
                styles.card,
                { 
                  borderColor: option.id === selectedTone 
                    ? theme.colors.primary[500] 
                    : 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: option.id === selectedTone 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(255, 255, 255, 0.05)'
                }
              ]}
              onPress={() => handleSelectTone(option.id)}
            >
              <View style={styles.cardContent}>
                <View style={styles.textContainer}>
                  <ThemedText style={[
                    styles.cardTitle,
                    { 
                      fontFamily: 'Quicksand-Bold',
                      color: option.id === selectedTone 
                        ? theme.colors.primary[500] 
                        : 'white'
                    }
                  ]}>
                    {option.label}
                  </ThemedText>
                  <ThemedText style={[
                    styles.cardDescription,
                    { 
                      fontFamily: 'Quicksand-Medium',
                      opacity: option.id === selectedTone ? 1 : 0.9,
                      color: option.id === selectedTone 
                        ? theme.colors.primary[500] 
                        : 'white'
                    }
                  ]}>
                    {option.description}
                  </ThemedText>
                </View>
                {option.image && scaleAnims[option.id] && (
                  <Animated.Image
                    source={option.image}
                    style={[
                      styles.cardImage,
                      { transform: [{ scale: scaleAnims[option.id] }] },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          ))}
        </ScrollView>
        
        <View style={styles.buttonsContainer}>
          <PrimaryButton 
            label={isLastScreen ? t('onboarding.nuboToneScreen.startButton') : t('common.Continue')}
            onPress={handleNext}
            width={width * 0.85}
            useDisplayFont={true}
            isLoading={isLoading}
          />
        </View>
      </Animated.View>

      <ConfirmModal
        visible={isErrorModalVisible}
        title="Onboarding Error"
        message={error || ''}
        confirmText="OK"
        onConfirm={() => setIsErrorModalVisible(false)}
        onCancel={() => setIsErrorModalVisible(false)}
        showCancel={false}
        iconName="alert-circle-outline"
        iconColor={theme.colors.feedback.error[colorScheme || 'light']}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  questionContainer: {
    marginTop: 24,
    marginBottom: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
  cardsContainer: {
    width: '100%',
    flex: 1,
  },
  cardsContentContainer: {
    alignItems: 'center',
    paddingBottom: 120, // To make space for the button
  },
  card: {
    width: width * 0.8,
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  cardImage: {
    width: 80,
    height: 80,
    marginLeft: 10,
    resizeMode: 'contain',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: 'white',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    width: '100%',
  },
}); 