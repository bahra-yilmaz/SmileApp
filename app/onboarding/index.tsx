import React, { useCallback, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Text, FlatList, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Theme } from '../../constants/Theme';
import { ThemedText } from '../../components/ThemedText';
import { LANGUAGES } from '../i18n';
import { useFonts } from 'expo-font';
import { GlassmorphicCard } from '../../components/ui/GlassmorphicCard';
import PrimaryButton from '../../components/ui/PrimaryButton';
import { ExpandableMascotCard } from '../../components/home';
import { useRandomMascot } from '../../utils/mascotUtils';
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

  // Get a random mascot and its positioning for the new card
  const { variant: randomMascotVariant, position: mascotPosition } = useRandomMascot();

  // Animation for Circle 1 (fill and show checkmark)
  const circle1BackgroundColor = useSharedValue('transparent');
  const circle1BorderWidth = useSharedValue(2); // Start with border
  const checkmarkOpacity = useSharedValue(0);
  const checkmarkScale = useSharedValue(0.5); // Start smaller for a pop-in effect

  useEffect(() => {
    if (isCheckpoint1Done) {
      // Transition to "done" state
      circle1BackgroundColor.value = withTiming('white', { duration: 300, easing: Easing.out(Easing.quad) });
      circle1BorderWidth.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });
      // Animate checkmark with delay
      checkmarkOpacity.value = withDelay(150, withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) })); 
      checkmarkScale.value = withDelay(150, withTiming(1, { duration: 300, easing: Easing.elastic(1) }));
    } else {
      // Reset to initial unfilled state if needed (e.g., for a reset feature later)
      circle1BackgroundColor.value = withTiming('transparent', { duration: 200 });
      circle1BorderWidth.value = withTiming(2, { duration: 200 });
      checkmarkOpacity.value = withTiming(0, { duration: 150 });
      checkmarkScale.value = withTiming(0.5, { duration: 150 });
    }
  }, [isCheckpoint1Done]); // Removed dependencies not directly used in this effect logic

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

  return (
    <Animated.View style={[
      styles.container, 
      { opacity: fadeAnim, position: 'absolute', width: '100%', height: '100%' }
    ]}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <ThemedText style={[styles.title, { fontFamily: fontFamilyTitle }]}>
            Welcome to{
              '\n' /* Newline character */
            }
            your app{
              '\n' /* Newline character */
            }  
          </ThemedText>
        </View>

        {/* Expandable Mascot Card */}
        <View style={styles.mascotCardContainer}>
          <ExpandableMascotCard 
            mascotVariant={randomMascotVariant}
            mascotPosition={mascotPosition}
            greetingText={t('onboarding.welcomeMascotGreeting')}
            isExpanded={isMascotCardExpanded}
            onPress={() => {
              setIsMascotCardExpanded(true);
              setIsCheckpoint1Done(true);
            }}
            enablePulse={!isMascotCardExpanded}
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
          {/* Circles 2 and 3 are now static (no pulse animation applied) */}
          <Reanimated.View style={[styles.checkpointCircle, styles.checkpointCircle2]} />
          <Reanimated.View style={[styles.checkpointCircle, styles.checkpointCircle3]} />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            label="Lets Go"
            onPress={handleContinue}
            useDisplayFont={true}
            width={width * 0.85}
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
    top: 280,
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
});