import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable, FlatList, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import PrimaryButton from '../ui/PrimaryButton';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';
import dayjs from 'dayjs';
import SecondaryButton from '../ui/SecondaryButton';

interface ToothbrushDurationScreenProps {
  nextScreenPath: string;
  index: number;
  totalScreens: number;
  isLastScreen?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;

export default function ToothbrushDurationScreen({
  nextScreenPath,
  index,
  totalScreens,
  isLastScreen = false,
}: ToothbrushDurationScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData, onboardingData } = useOnboarding();
  // Default to option 2 ('3-4 weeks'), which is a common toothbrush replacement time
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  const DURATION_OPTIONS = useMemo(() => [
    { id: 'less_than_1_week', label: t('onboarding.toothbrushDurationScreen.options.lessThan1Week'), value: 0 },
    { id: '1_2_weeks', label: t('onboarding.toothbrushDurationScreen.options.oneToTwoWeeks'), value: 1 },
    { id: '3_4_weeks', label: t('onboarding.toothbrushDurationScreen.options.threeToFourWeeks'), value: 2 },
    { id: '2_months', label: t('onboarding.toothbrushDurationScreen.options.about2Months'), value: 3 },
    { id: '3_months', label: t('onboarding.toothbrushDurationScreen.options.about3Months'), value: 4 },
    { id: 'dont_remember', label: t('onboarding.toothbrushDurationScreen.options.dontRemember'), value: 5 }
  ], [t]);
  
  useEffect(() => {
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

    // Scroll to the default selected duration
    setTimeout(() => {
      // Find index of default selection and scroll to it
      const indexToScrollTo = DURATION_OPTIONS.findIndex(option => option.value === selectedDuration);
      if (indexToScrollTo !== -1 && flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: indexToScrollTo * ITEM_HEIGHT,
          animated: true,
        });
      }
    }, 500);
  }, []);

  const handleNext = () => {
    let startDate: string | null = null;
    const now = dayjs();

    switch (selectedDuration) {
      case 0: // Less than 1 week
        startDate = now.subtract(3, 'day').toISOString();
        break;
      case 1: // 1-2 weeks ago
        startDate = now.subtract(10, 'day').toISOString();
        break;
      case 2: // 3-4 weeks ago
        startDate = now.subtract(3, 'week').toISOString();
        break;
      case 3: // About 2 months ago
        startDate = now.subtract(2, 'month').toISOString();
        break;
      case 4: // About 3 months ago
        startDate = now.subtract(3, 'month').toISOString();
        break;
      case 5: // I don't remember
        const oneMonthAgo = dayjs().subtract(1, 'month').toISOString();
        startDate = oneMonthAgo;
        break;
      default:
        startDate = null;
    }

    updateOnboardingData({ toothbrush_start_date: startDate });
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(nextScreenPath as any);
  };

  const handleSelectDuration = (value: number) => {
    setSelectedDuration(value);
    const indexToScrollTo = DURATION_OPTIONS.findIndex(option => option.value === value);
    if (indexToScrollTo !== -1 && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: indexToScrollTo * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderDurationItem = ({ item }: { item: typeof DURATION_OPTIONS[0] }) => {
    const isSelected = item.value === selectedDuration;
    const fontFamily = fontsLoaded ? 'Quicksand-Bold' : undefined;
    
    return (
      <Pressable
        style={[
          styles.durationItem,
          isSelected && styles.selectedDurationItem
        ]}
        onPress={() => handleSelectDuration(item.value)}
      >
        <ThemedText 
          style={[
            styles.durationText, 
            { fontFamily },
            isSelected && { 
              color: theme.colors.primary[500],
              fontSize: 20,
            }
          ]}
        >
          {item.label}
        </ThemedText>
      </Pressable>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const onMomentumScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / ITEM_HEIGHT);
    const option = DURATION_OPTIONS[index];

    if (option !== undefined && option.value !== selectedDuration) {
      setSelectedDuration(option.value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / ITEM_HEIGHT);

    if (index >= 0 && index < DURATION_OPTIONS.length && index !== lastHapticIndex.current) {
      lastHapticIndex.current = index;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const headerHeight = insets.top + (Platform.OS === 'ios' ? 10 : 15) + 16 + 32;

  return (
    <View style={styles.container}>
      <View style={[styles.progressContainer, { top: headerHeight + 10 }]}>
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
            { fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined }
          ]}>
            {t('onboarding.toothbrushDurationScreen.question')}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.durationPickerContainer}>
        <View style={[
          styles.selectedHighlight, 
          { 
            borderColor: theme.colors.primary[200],
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        ]} />
        
        <FlatList
          ref={flatListRef}
          data={DURATION_OPTIONS}
          renderItem={renderDurationItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.durationList}
          contentContainerStyle={{
            paddingVertical: (VISIBLE_ITEMS - 1) * ITEM_HEIGHT / 2,
          }}
        />

        <View style={styles.dontRememberButtonContainer}>
          <SecondaryButton
            label={t('onboarding.toothbrushDurationScreen.options.dontRemember')}
            onPress={() => {
              const oneMonthAgo = dayjs().subtract(1, 'month').toISOString();
              updateOnboardingData({ toothbrush_start_date: oneMonthAgo });
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(nextScreenPath as any);
            }}
            textStyle={{
              fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined,
              fontSize: 16,
            }}
          />
        </View>
      </View>
      
      <View style={styles.buttonsContainer}>
        <PrimaryButton 
          label={isLastScreen ? t('onboarding.toothbrushDurationScreen.startButton') : t('common.Continue')}
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
  progressContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
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
  durationPickerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '80%',
    marginLeft: -width * 0.4,
    marginTop: -(ITEM_HEIGHT * VISIBLE_ITEMS) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHighlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    width: '90%',
    borderRadius: 30,
    borderWidth: 2,
    top: '50%',
    marginTop: -ITEM_HEIGHT / 2,
  },
  durationList: {
    width: '100%',
  },
  durationItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDurationItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
    textAlign: 'center'
  },
  dontRememberButtonContainer: {
    position: 'absolute',
    top: '100%',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    opacity: 0.7,
    color: 'white',
  },
  nextButton: {
    backgroundColor: '#0095E6',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold',
  },
  questionContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
}); 