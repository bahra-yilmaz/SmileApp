import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text, FlatList, Image, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import ThemedText from '../../components/ThemedText';
import { useFonts } from 'expo-font';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ExpandableMascotCard } from '../../components/home';
import type { MascotVariant, PpMascotVariant, NonPpMascotVariant, MascotConfig } from '../../types/mascot';
import Reanimated, { 
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  cancelAnimation,
  withDelay,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - (Theme.spacing.lg * 2) - Theme.spacing.md) / 2;

// Define type for language item
type LanguageItem = {
  code: string;
  name: string;
  flag: string;
};

export default function OnboardingWelcome() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [isMascotCardExpanded, setIsMascotCardExpanded] = useState(false);
  const [isCheckpoint1Done, setIsCheckpoint1Done] = useState(false);
  const [isCheckpoint2Done, setIsCheckpoint2Done] = useState(false);
  const [isCheckpoint3Done, setIsCheckpoint3Done] = useState(false);
  const [isContinueButtonEnabled, setIsContinueButtonEnabled] = useState(false);

  // Mascot card configuration state
  const initialStageConfig = {
    greetingText: t('onboarding.mascotGreetingStage1'),
    collapsedVariant: 'nubo-wise-1-pp' as PpMascotVariant,
    expandedVariant: 'nubo-wise-1' as NonPpMascotVariant,
  };
  // Define text for the second stage directly
  const secondStageGreetingText = t('onboarding.mascotGreetingStage2');
  const finalStageGreetingText = t('onboarding.mascotGreetingStage3');

  // Define variants for the second stage
  const secondStageCollapsedVariant: PpMascotVariant = 'nubo-brushing-1-pp';
  const secondStageExpandedVariant: NonPpMascotVariant = 'nubo-daily-brush-2';

  // Define text and variants for the final stage (stage 3)
  const finalStageCollapsedVariant: PpMascotVariant = 'nubo-cool-3-pp';
  const finalStageExpandedVariant: NonPpMascotVariant = 'nubo-cool-2';

  const [mascotCardConfig, setMascotCardConfig] = useState(initialStageConfig);

  // Animation for Circle 1 (fill and show checkmark)
  const circle1BackgroundColor = useSharedValue('transparent');
  const circle1BorderWidth = useSharedValue(2); // Start with border
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.5); // Start smaller for a pop-in effect

  // Animation values for Circle 2
  const circle2Opacity = useSharedValue(0);
  const circle2BackgroundColor = useSharedValue('transparent');
  const circle2BorderWidth = useSharedValue(2);
  const checkmark2Opacity = useSharedValue(0);
  const checkmark2Scale = useSharedValue(0.5);

  // Animation values for Circle 3
  const circle3Opacity = useSharedValue(0);
  const circle3BackgroundColor = useSharedValue('transparent');
  const circle3BorderWidth = useSharedValue(2);
  const checkmark3Opacity = useSharedValue(0);
  const checkmark3Scale = useSharedValue(0.5);

  useEffect(() => {
    if (isCheckpoint1Done) {
      // Slower transition to "done" state for Circle 1
      circle1BackgroundColor.value = withTiming('white', { duration: 500, easing: Easing.out(Easing.quad) });
      circle1BorderWidth.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
      checkmarkOpacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
      checkmarkScale.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.elastic(1) }));
      // Reveal Circle 2
      circle2Opacity.value = withDelay(500, withTiming(1, { duration: 400 }));
    } else {
      // Reset Circle 1 to initial unfilled state
      circle1BackgroundColor.value = withTiming('transparent', { duration: 300 });
      circle1BorderWidth.value = withTiming(2, { duration: 300 });
      checkmarkOpacity.value = withTiming(0, { duration: 200 });
      checkmarkScale.value = withTiming(0.5, { duration: 200 });
      // Hide Circle 2 if C1 is reset
      circle2Opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isCheckpoint1Done, circle1BackgroundColor, circle1BorderWidth, checkmarkOpacity, checkmarkScale, circle2Opacity]);

  // useEffect for Circle 2 completion and Circle 3 reveal
  useEffect(() => {
    if (isCheckpoint2Done) {
      circle2BackgroundColor.value = withTiming('white', { duration: 500, easing: Easing.out(Easing.quad) });
      circle2BorderWidth.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
      checkmark2Opacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
      checkmark2Scale.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.elastic(1) }));
      // Reveal Circle 3 only if it's not already marked done (in case of state resets)
      if (!isCheckpoint3Done) { 
        circle3Opacity.value = withDelay(500, withTiming(1, { duration: 400 }));
      }
    } else {
      circle2BackgroundColor.value = withTiming('transparent', { duration: 300 });
      circle2BorderWidth.value = withTiming(2, { duration: 300 });
      checkmark2Opacity.value = withTiming(0, { duration: 200 });
      checkmark2Scale.value = withTiming(0.5, { duration: 200 });
      // Hide Circle 3 if C2 is reset, but only if C3 isn't done
      if (!isCheckpoint3Done) {
        circle3Opacity.value = withTiming(0, { duration: 300 }); 
      }
    }
  }, [isCheckpoint2Done, isCheckpoint3Done, circle2BackgroundColor, circle2BorderWidth, checkmark2Opacity, checkmark2Scale, circle3Opacity]);

  // useEffect for Circle 3 completion
  useEffect(() => {
    if (isCheckpoint3Done) {
      circle3Opacity.value = withTiming(1, { duration: 0 });
      circle3BackgroundColor.value = withTiming('white', { duration: 500, easing: Easing.out(Easing.quad) });
      circle3BorderWidth.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad) });
      checkmark3Opacity.value = withDelay(300, withTiming(1, { duration: 400, easing: Easing.out(Easing.quad) }));
      checkmark3Scale.value = withDelay(300, withTiming(1, { duration: 500, easing: Easing.elastic(1) }));
      setIsContinueButtonEnabled(true);
    } else {
      circle3BackgroundColor.value = withTiming('transparent', { duration: 300 });
      circle3BorderWidth.value = withTiming(2, { duration: 300 });
      checkmark3Opacity.value = withTiming(0, { duration: 200 });
      checkmark3Scale.value = withTiming(0.5, { duration: 200 });
      setIsContinueButtonEnabled(false);
    }
  }, [isCheckpoint3Done, circle3BackgroundColor, circle3BorderWidth, checkmark3Opacity, checkmark3Scale, circle3Opacity]);

  const animatedCircle1Style = useAnimatedStyle(() => {
    return {
      backgroundColor: circle1BackgroundColor.value,
      borderWidth: circle1BorderWidth.value,
    };
  });

  const animatedCheckmarkStyle = useAnimatedStyle(() => {
    return {
      opacity: checkmarkOpacity.value,
      transform: [{ scale: checkmarkScale.value }],
    };
  });

  const animatedCircle2Style = useAnimatedStyle(() => {
    return {
      opacity: circle2Opacity.value,
      backgroundColor: circle2BackgroundColor.value,
      borderWidth: circle2BorderWidth.value,
    };
  });

  const animatedCheckmark2Style = useAnimatedStyle(() => {
    return {
      opacity: checkmark2Opacity.value,
      transform: [{ scale: checkmark2Scale.value }],
    };
  });

  const animatedCircle3Style = useAnimatedStyle(() => {
    return {
      opacity: circle3Opacity.value,
      backgroundColor: circle3BackgroundColor.value,
      borderWidth: circle3BorderWidth.value,
    };
  });

  const animatedCheckmark3Style = useAnimatedStyle(() => {
    return {
      opacity: checkmark3Opacity.value,
      transform: [{ scale: checkmark3Scale.value }],
    };
  });

  // Load fonts
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });

  const handleLanguageSelect = useCallback(async (langCode: string) => {
    // Change the language
    await i18n.changeLanguage(langCode);
    // Update selected language
    setSelectedLanguage(langCode);
  }, [i18n]);

  const handleContinue = useCallback(() => {
    // Fade out this screen
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Then navigate when animation completes
      router.replace('/onboarding/features');
    });
  }, [router, fadeAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // If fonts aren't loaded yet, we'll still render but with system fonts as fallback
  const fontFamilyTitle = fontsLoaded ? 'Quicksand-Bold' : 'System';
  const fontFamilySmile = fontsLoaded ? 'Quicksand-Bold' : 'System';

  const renderLanguageItem = ({ item: lang }: { item: LanguageItem }) => (
    <TouchableOpacity
      key={lang.code}
      onPress={() => handleLanguageSelect(lang.code)}
      style={styles.languageButton}
    >
      <GlassmorphicCard
        intensity={25}
        borderRadius="lg"
        shadow="sm"
        width={ITEM_WIDTH}
        style={[
          styles.buttonContent,
          { 
            backgroundColor: selectedLanguage === lang.code 
              ? 'rgba(0, 100, 255, 0.3)' 
              : 'rgba(0, 0, 0, 0.2)' 
          }
        ]}
      >
        <View style={styles.languageRow}>
          <Text style={styles.flagText}>{lang.flag}</Text>
          <ThemedText style={styles.languageText}>
            {t(`languages.${lang.code}`)}
          </ThemedText>
        </View>
      </GlassmorphicCard>
    </TouchableOpacity>
  );

  // Memoized function to handle collapsing the card and setting appropriate config
  const handleCollapseCard = useCallback(() => {
    setIsMascotCardExpanded(false);
    if (!isCheckpoint1Done) {
      setMascotCardConfig(initialStageConfig);
    } else if (!isCheckpoint2Done) {
      setMascotCardConfig({
        greetingText: secondStageGreetingText,
        collapsedVariant: secondStageCollapsedVariant,
        expandedVariant: secondStageExpandedVariant,
      });
    } else { // Covers checkpoint 2 done, or checkpoint 3 done (or all done)
      setMascotCardConfig({
        greetingText: finalStageGreetingText,
        collapsedVariant: finalStageCollapsedVariant,
        expandedVariant: finalStageExpandedVariant,
      });
    }
  }, [isCheckpoint1Done, isCheckpoint2Done, initialStageConfig, secondStageGreetingText, secondStageCollapsedVariant, secondStageExpandedVariant, finalStageGreetingText, finalStageCollapsedVariant, finalStageExpandedVariant]);

  // Memoized function to handle expanding the card and progressing checkpoints
  const handleExpandAndProgressCard = useCallback(() => {
    if (!isMascotCardExpanded) {
      setIsMascotCardExpanded(true);
      if (!isCheckpoint1Done) {
        setIsCheckpoint1Done(true);
        setMascotCardConfig(initialStageConfig);
      } else if (!isCheckpoint2Done) {
        setIsCheckpoint2Done(true);
        setMascotCardConfig({
          greetingText: secondStageGreetingText,
          collapsedVariant: secondStageCollapsedVariant,
          expandedVariant: secondStageExpandedVariant,
        });
      } else if (!isCheckpoint3Done) {
        setIsCheckpoint3Done(true);
        setMascotCardConfig({
          greetingText: finalStageGreetingText,
          collapsedVariant: finalStageCollapsedVariant,
          expandedVariant: finalStageExpandedVariant,
        });
      } else {
        setMascotCardConfig({
          greetingText: finalStageGreetingText,
          collapsedVariant: finalStageCollapsedVariant,
          expandedVariant: finalStageExpandedVariant,
        });
      }
    }
  }, [isMascotCardExpanded, isCheckpoint1Done, isCheckpoint2Done, isCheckpoint3Done, initialStageConfig, secondStageGreetingText, secondStageCollapsedVariant, secondStageExpandedVariant, finalStageGreetingText, finalStageCollapsedVariant, finalStageExpandedVariant]);

  const preparedConfigForCard: MascotConfig = {
    id: `onboarding-${mascotCardConfig.collapsedVariant}-${mascotCardConfig.expandedVariant}`, // Unique enough ID for onboarding
    collapsedVariant: mascotCardConfig.collapsedVariant,
    expandedVariant: mascotCardConfig.expandedVariant,
    greetingTextKey: 'onboarding.mascotGreeting', // Placeholder, actual text supplied by greetingText prop
    probability: 1, // Default probability for static onboarding card
  };

  return (
    <Animated.View style={[
      styles.container, 
      { opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }
    ]}>
      {/* Backdrop Pressable to collapse mascot card, disabled after C3 is done */}
      {isMascotCardExpanded && !isCheckpoint3Done && (
        <Pressable
          style={styles.backdropPressable} 
          onPress={handleCollapseCard}
        />
      )}

      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { fontFamily: fontFamilyTitle }]}>
            {t('onboarding.welcomeScreen.mainTitleApp')} 
          </ThemedText>
        </View>

        {/* Expandable Mascot Card */}
        <View style={styles.mascotCardContainer}>
          <ExpandableMascotCard 
            config={preparedConfigForCard}
            greetingText={mascotCardConfig.greetingText}
            isExpanded={isMascotCardExpanded}
            onPress={handleExpandAndProgressCard}
            onPressWhenExpanded={handleCollapseCard}
            enablePulse={!isMascotCardExpanded && (!isCheckpoint1Done || (isCheckpoint1Done && !isCheckpoint2Done) || (isCheckpoint1Done && isCheckpoint2Done && !isCheckpoint3Done))}
          />
        </View>

        {/* Mountain image container for relative positioning of circles */}
        <View style={styles.mountainImageContainer}>
          <Image 
            source={require('../../assets/images/mountain-faded.png')} 
            style={styles.backgroundImage} 
            resizeMode="cover"
          />
          {/* Checkpoint Circles */}
          <Reanimated.View style={[styles.checkpointCircle, styles.checkpointCircle1, animatedCircle1Style]}>
            <Reanimated.View style={[styles.checkmarkContainer, animatedCheckmarkStyle]}>
              <MaterialCommunityIcons name="check" size={20} color="#0057FF" />
            </Reanimated.View>
          </Reanimated.View>
          <Reanimated.View style={[styles.checkpointCircle, styles.checkpointCircle2, animatedCircle2Style]}>
            <Reanimated.View style={[styles.checkmarkContainer, animatedCheckmark2Style]}>
              <MaterialCommunityIcons name="check" size={20} color="#0057FF" />
            </Reanimated.View>
          </Reanimated.View>
          <Reanimated.View style={[styles.checkpointCircle, styles.checkpointCircle3, animatedCircle3Style]}>
            <Reanimated.View style={[styles.checkmarkContainer, animatedCheckmark3Style]}>
              <MaterialCommunityIcons name="check" size={20} color="#0057FF" />
            </Reanimated.View>
          </Reanimated.View>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label={t('onboarding.welcomeScreen.letsGoButton')}
            onPress={handleContinue}
            useDisplayFont={true}
            width={width * 0.85}
            disabled={!isContinueButtonEnabled}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: width,
    height: width * (9/16),
  },
  mountainImageContainer: {
    width: width,
    height: width * (9/16),
    marginBottom: 30,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    paddingBottom: 40,
  },
  titleContainer: {
    position: 'absolute',
    top: 160,
    alignItems: 'center',
    width: '100%',
    zIndex: 2,
  },
  title: {
    fontSize: 40,
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    lineHeight: 48,
  },
  languageGrid: {
    width: '100%',
    paddingHorizontal: Theme.spacing.lg,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  languageButton: {
    marginBottom: Theme.spacing.md,
  },
  buttonContent: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagText: {
    fontSize: 24,
    marginRight: Theme.spacing.md,
  },
  languageText: {
    fontSize: Theme.typography.sizes.md,
    color: 'white',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  mascotCardContainer: {
    position: 'absolute',
    top: 300,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: Theme.spacing.lg,
  },
  checkpointCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'transparent',
    borderColor: 'white',
    borderWidth: 2,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  checkpointCircle1: {
    top: '50%',
    left: '15%',
    marginTop: -17.5,
    transform: [{ translateX: -15 }, { translateY: -25 }],
  },
  checkpointCircle2: {
    top: '35%',
    left: '30%',
    marginTop: -17.5,
    transform: [{ translateX: 80 }, { translateY: -50 }],
  },
  checkpointCircle3: {
    top: '20%',
    left: '45%',
    marginTop: -17.5,
    transform: [{ translateX: 170 }, { translateY: -80 }],
  },
  checkmarkContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
});