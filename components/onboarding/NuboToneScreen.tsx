import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import { OnboardingService } from '../../services/OnboardingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import PrimaryButton from '../ui/PrimaryButton';
import { useTranslation } from 'react-i18next';

const NUBO_TONE_KEY = 'nubo_tone';

// Nubo tone options will be defined inside the component using t() and useMemo

interface NuboToneScreenProps {
  title: string;
  description: string;
  nextScreenPath: string;
  index: number;
  totalScreens: number;
  isLastScreen?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = 120;
const CARD_MARGIN = 10;

export default function NuboToneScreen({
  title,
  description,
  nextScreenPath,
  index,
  totalScreens,
  isLastScreen = false,
}: NuboToneScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [selectedTone, setSelectedTone] = useState<string>('supportive'); // Default to supportive
  const insets = useSafeAreaInsets();
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Run animations when the component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleNext = async () => {
    // Save the selected Nubo tone
    try {
      const selectedOption = TONE_OPTIONS.find(option => option.id === selectedTone);
      const toneData = {
        id: selectedTone,
        label: selectedOption?.label || '',
        description: selectedOption?.description || ''
      };
      await AsyncStorage.setItem(NUBO_TONE_KEY, JSON.stringify(toneData));
    } catch (error) {
      console.error('Error saving Nubo tone:', error);
    }

    if (isLastScreen) {
      // If this is the last screen, mark onboarding as completed
      await OnboardingService.markOnboardingAsCompleted();
    }
    router.push(nextScreenPath as any);
  };

  const handleSelectTone = (toneId: string) => {
    setSelectedTone(toneId);
  };

  // Calculate header height to position progress indicators below it
  const headerHeight = insets.top + (Platform.OS === 'ios' ? 10 : 15) + 16 + 32; // SafeArea + additionalPadding + paddingVertical + fontSize

  const TONE_OPTIONS = useMemo(() => [
    { id: 'playful', label: t('onboarding.nuboToneScreen.options.playful_label'), description: t('onboarding.nuboToneScreen.options.playful_description') },
    { id: 'supportive', label: t('onboarding.nuboToneScreen.options.supportive_label'), description: t('onboarding.nuboToneScreen.options.supportive_description') },
    { id: 'motivational', label: t('onboarding.nuboToneScreen.options.motivational_label'), description: t('onboarding.nuboToneScreen.options.motivational_description') },
    { id: 'educational', label: t('onboarding.nuboToneScreen.options.educational_label'), description: t('onboarding.nuboToneScreen.options.educational_description') }
  ], [t]);

  return (
    <View style={styles.container}>
      {/* Progress indicators and question text */}
      <View style={styles.topContainer}>
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
          
          {/* Question text */}
          <View style={styles.questionContainer}>
            <ThemedText style={[
              styles.questionText,
              { fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined }
            ]}>
              {t('onboarding.nuboToneScreen.question')}
            </ThemedText>
          </View>
        </View>
        
        {/* Tone selection cards */}
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
              <ThemedText style={[
                styles.cardTitle,
                { 
                  fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined,
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
                  fontFamily: fontsLoaded ? 'Quicksand-Medium' : undefined,
                  opacity: option.id === selectedTone ? 1 : 0.9,
                  color: option.id === selectedTone 
                    ? theme.colors.primary[500] 
                    : 'white'
                }
              ]}>
                {option.description}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      
      {/* Action buttons - positioned at bottom */}
      <View style={styles.buttonsContainer}>
        <PrimaryButton 
          label={isLastScreen ? t('onboarding.nuboToneScreen.startButton') : t('common.Continue')}
          onPress={handleNext}
          width={width * 0.85}
          useDisplayFont={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  topContainer: {
    flex: 1,
    width: '100%',
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
    paddingBottom: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    borderWidth: 2,
    marginBottom: CARD_MARGIN,
    padding: 20,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 22,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: 'white',
  },
  buttonsContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
}); 