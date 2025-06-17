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

interface BrushingGoalScreenProps {
  title: string;
  description: string;
  nextScreenPath: string;
  index: number;
  totalScreens: number;
  isLastScreen?: boolean;
}

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 5;

export default function BrushingGoalScreen({
  nextScreenPath,
  index,
  totalScreens,
  isLastScreen = false,
}: BrushingGoalScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData, onboardingData } = useOnboarding();
  const [selectedGoal, setSelectedGoal] = useState<number>(onboardingData.brushing_target ?? 2);
  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const insets = useSafeAreaInsets();
  
  const BRUSHING_OPTIONS = useMemo(() => [
    { value: 1, label: t('onboarding.brushingGoalScreen.optionsLabel_one', { count: 1 }) },
    { value: 2, label: t('onboarding.brushingGoalScreen.optionsLabel_other', { count: 2 }) },
    { value: 3, label: t('onboarding.brushingGoalScreen.optionsLabel_other', { count: 3 }) },
    { value: 4, label: t('onboarding.brushingGoalScreen.optionsLabel_other', { count: 4 }) },
    { value: 5, label: t('onboarding.brushingGoalScreen.optionsLabel_other', { count: 5 }) }
  ], [t]);
  
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
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

    setTimeout(() => {
      const indexToScrollTo = BRUSHING_OPTIONS.findIndex(option => option.value === selectedGoal);
      if (indexToScrollTo !== -1 && flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: indexToScrollTo * ITEM_HEIGHT,
          animated: true,
        });
      }
    }, 500);
  }, []);

  const handleNext = () => {
    updateOnboardingData({ brushing_target: selectedGoal });
    
    // The final save logic will be on the last screen, not here.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(nextScreenPath as any);
  };

  const handleSelectGoal = (value: number) => {
    setSelectedGoal(value);
    const indexToScrollTo = BRUSHING_OPTIONS.findIndex(option => option.value === value);
    if (indexToScrollTo !== -1 && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: indexToScrollTo * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderGoalItem = ({ item }: { item: typeof BRUSHING_OPTIONS[0] }) => {
    const isSelected = item.value === selectedGoal;
    const fontFamily = fontsLoaded ? 'Quicksand-Bold' : undefined;
    
    return (
      <Pressable
        style={[
          styles.goalItem,
          isSelected && styles.selectedGoalItem
        ]}
        onPress={() => handleSelectGoal(item.value)}
      >
        <ThemedText 
          style={[
            styles.goalText, 
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
    const option = BRUSHING_OPTIONS[index];

    if (option !== undefined && option.value !== selectedGoal) {
      setSelectedGoal(option.value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / ITEM_HEIGHT);
    
    if (index >= 0 && index < BRUSHING_OPTIONS.length && index !== lastHapticIndex.current) {
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
            {t('onboarding.brushingGoalScreen.question')}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.goalPickerContainer}>
        <View style={[
          styles.selectedHighlight, 
          { 
            borderColor: theme.colors.primary[200],
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        ]} />
        
        <FlatList
          ref={flatListRef}
          data={BRUSHING_OPTIONS}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.value.toString()}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.goalList}
          contentContainerStyle={{
            paddingVertical: (VISIBLE_ITEMS - 1) * ITEM_HEIGHT / 2,
          }}
        />
      </View>
      
      <View style={styles.buttonsContainer}>
        <PrimaryButton 
          label={isLastScreen ? t('onboarding.brushingGoalScreen.startButton') : t('common.Continue')}
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
  goalPickerContainer: {
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
  goalList: {
    width: '100%',
  },
  goalItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedGoalItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
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