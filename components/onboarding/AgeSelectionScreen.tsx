import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, FlatList, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../../context/OnboardingContext';

interface AgeSelectionScreenProps {
  title: string;
  description: string;
  nextScreenPath: string;
  index: number;
  totalScreens: number;
}

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 7;

export default function AgeSelectionScreen({
  nextScreenPath,
  index,
  totalScreens,
}: AgeSelectionScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { updateOnboardingData, onboardingData } = useOnboarding();

  const AGES = React.useMemo(() => [
    { id: 'range_0_5', label: t('onboarding.ageSelectionScreen.ageRange0_5') },
    { id: 'range_6_12', label: t('onboarding.ageSelectionScreen.ageRange6_12') },
    { id: 'range_13_18', label: t('onboarding.ageSelectionScreen.ageRange13_18') },
    { id: 'range_19_29', label: t('onboarding.ageSelectionScreen.ageRange19_29') },
    { id: 'range_30_45', label: t('onboarding.ageSelectionScreen.ageRange30_45') },
    { id: 'range_46_60', label: t('onboarding.ageSelectionScreen.ageRange46_60') },
    { id: 'range_60_plus', label: t('onboarding.ageSelectionScreen.ageRange60_plus') }
  ], [t]);

  const [selectedIndex, setSelectedIndex] = useState<number>(onboardingData.age_group ?? 3);
  const flatListRef = useRef<FlatList>(null);
  const lastHapticIndex = useRef<number | null>(null);
  const insets = useSafeAreaInsets();

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
      if (flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: selectedIndex * ITEM_HEIGHT,
          animated: true,
        });
      }
    }, 500);
  }, []);

  const handleNext = () => {
    updateOnboardingData({ age_group: selectedIndex });
    router.push(nextScreenPath as any);
  };

  const handleSelectAge = (indexToSelect: number) => {
    setSelectedIndex(indexToSelect);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: indexToSelect * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderAgeItem = ({ item, index: itemIndex }: { item: typeof AGES[0], index: number }) => {
    const isSelected = itemIndex === selectedIndex;
    const fontFamily = fontsLoaded ? 'Quicksand-Bold' : undefined;

    return (
      <Pressable
        style={[styles.ageItem, isSelected && styles.selectedAgeItem]}
        onPress={() => handleSelectAge(itemIndex)}
      >
        <ThemedText
          style={[
            styles.ageText,
            { fontFamily },
            isSelected && {
              color: theme.colors.primary[500],
              fontSize: 24,
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
    if (index !== selectedIndex) {
      setSelectedIndex(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / ITEM_HEIGHT);
    if (index >= 0 && index < AGES.length && index !== lastHapticIndex.current) {
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
                  backgroundColor: i === index ? theme.colors.primary[600] : 'white',
                  width: i === index ? 24 : 8,
                  opacity: i === index ? 1 : 0.7
                }
              ]}
            />
          ))}
        </View>
        <View style={styles.questionContainer}>
          <ThemedText style={[styles.questionText, { fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined }]}>
            {t('onboarding.ageSelectionScreen.question')}
          </ThemedText>
        </View>
      </View>
      <View style={styles.agePickerContainer}>
        <View style={[styles.selectedHighlight, { borderColor: theme.colors.primary[200], backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
        <FlatList
          ref={flatListRef}
          data={AGES}
          renderItem={renderAgeItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.ageList}
          contentContainerStyle={{
            paddingVertical: (VISIBLE_ITEMS - 1) * ITEM_HEIGHT / 2,
          }}
        />
        <View style={styles.childButtonContainer}>
          <SecondaryButton
            label={t('onboarding.ageSelectionScreen.useForChildButton')}
            onPress={() => {
              const specialIndex = AGES.length; // Treat button as its own option (index 7)
              updateOnboardingData({ age_group: specialIndex });
              router.push(nextScreenPath as any);
            }}
            textStyle={{
              fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined,
              fontSize: 16
            }}
          />
        </View>
      </View>
      <View style={styles.buttonsContainer}>
        <PrimaryButton
          label={t('onboarding.ageSelectionScreen.continueButton')}
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
  agePickerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '60%',
    marginLeft: -width * 0.3,
    marginTop: -(ITEM_HEIGHT * VISIBLE_ITEMS) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHighlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    width: width * 0.3,
    borderRadius: 30,
    borderWidth: 2,
    top: '50%',
    marginTop: -ITEM_HEIGHT / 2,
  },
  ageList: {
    width: '100%',
  },
  ageItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAgeItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageText: {
    fontSize: 18,
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
  childButtonContainer: {
    position: 'absolute',
    top: '100%',
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
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