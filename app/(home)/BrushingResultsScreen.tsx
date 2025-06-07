import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable, Animated, PanResponder } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import ThemedText from '../../components/ThemedText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import DonutChart from '../../components/ui/DonutChart';
import { Colors } from '../../constants/Colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { BlurView } from 'expo-blur';
import MascotProgressBar from '../../components/ui/MascotProgressBar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constants for animation (mirroring TimerOverlay)
const FAB_BUTTON_SIZE = 70;
const FAB_BOTTOM_POSITION = 45;
const MAX_SCALE_ANIM = Math.max(screenWidth, screenHeight) * 2 / FAB_BUTTON_SIZE;
const MIN_CLOSE_THRESHOLD = 0.35; 
const MIN_VELOCITY = 0.5;

const BrushingResultsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  // Animation values
  const screenAppearAnim = useRef(new Animated.Value(1)).current; // Start at 1 for immediate background visibility
  const contentAppearAnim = useRef(new Animated.Value(0)).current; // Content fades in slowly
  const gestureAnim = useRef(new Animated.Value(0)).current;    // 0 = no gesture, 1 = full gesture
  const currentGestureValue = useRef(0);

  // State to control final rendering
  const [isFullyHidden, setIsFullyHidden] = useState(false); // New state
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false); // State for modal visibility

  // Themed background for the scaler, like TimerOverlay's expandingCircle
  const themedScalerBackgroundColor = theme.colorScheme === 'dark' ? '#1F2933' : '#F3F9FF';

  useEffect(() => {
    // Animate in content when the component mounts
    // screenAppearAnim is already 1, so background and container are instantly visible
    Animated.timing(contentAppearAnim, {
      toValue: 1,
      duration: 400, // Was 600ms
      useNativeDriver: true,
    }).start();
  }, [contentAppearAnim]); // Run once on mount, only depends on contentAppearAnim

  useEffect(() => {
    const gestureListener = gestureAnim.addListener(({ value }) => {
      currentGestureValue.current = value;
    });
    return () => {
      gestureAnim.removeListener(gestureListener);
    };
  }, [gestureAnim]);

  const animateCloseComplete = () => {
    setIsFullyHidden(true); // Set to hidden
    // Delay navigation slightly to allow React to render null first
    requestAnimationFrame(() => { 
      router.back(); // Correct method for expo-router
    });
  };

  const handleOpenConfirmModal = () => {
    setIsConfirmModalVisible(true);
  };

  const handleConfirmRevert = () => {
    setIsConfirmModalVisible(false);
    // Start the close animation and navigate back
    Animated.parallel([
      Animated.timing(screenAppearAnim, { // Use screenAppearAnim for background/container
        toValue: 0,
        duration: 400, // Was 600ms 
        useNativeDriver: true,
      }),
      Animated.timing(contentAppearAnim, { // Use contentAppearAnim for content
        toValue: 0,
        duration: 400, // Was 600ms
        useNativeDriver: true,
      }),
      Animated.timing(gestureAnim, {
        toValue: 0, 
        duration: 400, // Was 600ms
        useNativeDriver: true,
      }),
    ]).start(animateCloseComplete);
  };

  const handleCancelRevert = () => {
    setIsConfirmModalVisible(false);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx * 2);
      },
      onPanResponderGrant: () => {
        gestureAnim.setValue(0);
        screenAppearAnim.stopAnimation();
        contentAppearAnim.stopAnimation();
        gestureAnim.stopAnimation();
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) { // Only allow downward movement
          const gestureProgress = Math.min(1, gestureState.dy / (screenHeight * 0.4));
          const easedProgress = Math.pow(gestureProgress, 1.5);
          gestureAnim.setValue(easedProgress);
          // Link gesture progress to visibility animation directly for responsive scaling
          // visibilityAnim.setValue(1 - easedProgress); 
          // For gestures, primarily affect content and let the release handle full closure
          contentAppearAnim.setValue(1 - easedProgress); 
          if (easedProgress > 0.5) { // Start fading screen container if gesture is significant
            screenAppearAnim.setValue(1 - (easedProgress - 0.5) * 2);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const velocity = gestureState.vy;
        const shouldClose = 
          currentGestureValue.current > MIN_CLOSE_THRESHOLD ||
          (currentGestureValue.current > 0.2 && velocity > MIN_VELOCITY);

        if (shouldClose) {
          Animated.parallel([
            Animated.timing(screenAppearAnim, { // Use screenAppearAnim
              toValue: 0,
              duration: 400, // Was 600ms
              useNativeDriver: true,
            }),
            Animated.timing(contentAppearAnim, { // Use contentAppearAnim
              toValue: 0,
              duration: 400, // Was 600ms
              useNativeDriver: true,
            }),
            Animated.timing(gestureAnim, {
              toValue: 0, // Ensure gestureAnim goes to 0 for symmetrical scaling
              duration: 400, // Was 600ms
              useNativeDriver: true,
            }),
          ]).start(animateCloseComplete);
        } else {
          Animated.parallel([
            Animated.spring(screenAppearAnim, { // Spring screen container back to full
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(contentAppearAnim, { // Spring content back to full
              toValue: 1,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
            Animated.spring(gestureAnim, { // Spring gesture back to 0
              toValue: 0,
              friction: 5,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  const handleChevronClosePress = () => {
    Animated.parallel([
      Animated.timing(screenAppearAnim, { // Use screenAppearAnim
        toValue: 0,
        duration: 400, // Was 600ms
        useNativeDriver: true,
      }),
      Animated.timing(contentAppearAnim, { // Use contentAppearAnim
        toValue: 0,
        duration: 400, // Was 600ms
        useNativeDriver: true,
      }),
      Animated.timing(gestureAnim, {
        toValue: 0, // Ensure gestureAnim goes to 0 for symmetrical scaling
        duration: 400, // Was 600ms
        useNativeDriver: true,
      }),
    ]).start(animateCloseComplete);
  };

  // Animation style calculations (adapted from TimerOverlay)
  const finalTransformScale = Animated.multiply(
    MAX_SCALE_ANIM, // Use fixed MAX_SCALE_ANIM for the base scale
    Animated.subtract(1, gestureAnim.interpolate({ // Gesture reduces scale more directly
      inputRange: [0, 1],
      outputRange: [0, 0.7], // Max 70% reduction from gesture before visibilityAnim takes over fully
      extrapolate: 'clamp',
    }))
  );

  const overallOpacity = screenAppearAnim; // Screen container opacity

  const animatedContentOpacity = Animated.add(
    contentAppearAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }), // Content opacity
    gestureAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, -0.7, -1], extrapolate: 'clamp' })
  );

  // Add these back
  const brushingMinutes = 2;
  const brushingSeconds = 30;

  if (!fontsLoaded) {
    return null;
  }

  // Conditional rendering based on isFullyHidden
  if (isFullyHidden) {
    return null;
  }

  const cardWidth = screenWidth * 0.4;
  const cardHeight = 110;

  const card1Data = { progress: 75, value: "+90", label: "Points" };
  const card2Data = { progress: 100, value: "+200", label: "Bonus" };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  const handleGoHome = () => {
    router.push('/(home)');
  };

  return (
    <Animated.View 
      style={[styles.panGestureContainer, { opacity: overallOpacity }]}
      {...panResponder.panHandlers}
    >
      {/* 1. The scaling circular background */}
      <Animated.View
        style={[
          styles.animatedCircularScaler,
          {
            backgroundColor: themedScalerBackgroundColor,
            opacity: overallOpacity, // Background circle also uses screenAppearAnim for opacity
            transform: [{ scale: finalTransformScale }],
          }
        ]}
      />

      {/* 2. The screen's actual content, absolutely positioned OVER the scaler */}
      <Animated.View style={[styles.screenContentWrapper, { opacity: animatedContentOpacity }]}>
        <Image
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage} 
        />
        <View style={[styles.topContentContainerWrapper, { paddingTop: insets.top + 40 }]}>
          <ThemedText style={styles.title} variant="title">{t('brushingResultsScreen.title')}</ThemedText>

          <View style={styles.timeCardContainer}>
            <ThemedText style={[styles.cardText, { fontFamily: 'Merienda-Bold' }]}>
              {String(brushingMinutes).padStart(2, '0')}:{String(brushingSeconds).padStart(2, '0')}
            </ThemedText>
            <ThemedText style={styles.cardTitle}>{t('brushingResultsScreen.timeSpentCardTitle')}</ThemedText>
          </View>
        </View>

        <LightContainer
          style={[
            styles.bottomLightContainer,
            {
              height: screenHeight / 2.3,
              paddingBottom: insets.bottom + 10,
              flex: 0,
            }
          ]}
        >
          <View style={styles.cardsRowContainer}>
            <Pressable style={styles.shadowWrapper} onPress={() => console.log('Points card pressed')}> 
              <GlassmorphicCard
                width={cardWidth}
                borderRadius="md"
                intensity={60}
                shadow="none"
                containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
                style={styles.resultCardContent}
              >
                <View style={styles.metricContentContainer}>
                  <View style={styles.metricDonutContainer}>
                    <DonutChart
                      progress={card1Data.progress}
                      size={60}
                      thickness={10}
                      progressColor={Colors.primary[500]}
                    />
                  </View>
                  <View style={styles.metricTextContainer}>
                    <ThemedText style={styles.metricValue}>{card1Data.value}</ThemedText>
                    <ThemedText style={styles.metricLabel}>{t('brushingResultsScreen.pointsCardLabel')}</ThemedText>
                  </View>
                </View>
              </GlassmorphicCard>
            </Pressable>

            <Pressable style={styles.shadowWrapper} onPress={() => console.log('Bonus card pressed')}>
              <GlassmorphicCard
                width={cardWidth}
                borderRadius="md"
                intensity={60}
                shadow="none"
                containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
                style={styles.resultCardContent}
              >
                <View style={styles.metricContentContainer}>
                  <View style={styles.metricDonutContainer}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={65}
                      color={Colors.primary[500]}
                    />
                  </View>
                  <View style={styles.metricTextContainer}>
                    <ThemedText style={styles.metricValue}>{card2Data.value}</ThemedText>
                    <ThemedText style={styles.metricLabel}>{t('brushingResultsScreen.bonusCardLabel')}</ThemedText>
                  </View>
                </View>
              </GlassmorphicCard>
            </Pressable>
          </View>

          <View style={styles.motivationalContainer}>
            <View style={styles.textAndProgressContainer}>
              <ThemedText style={styles.motivationalText}>
                {t('brushingResultsScreen.motivationalText')}
              </ThemedText>
              <View style={styles.progressCard}>
                <View style={styles.cardBlur}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '75%' }]} />
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.mascotImageContainer}>
              <Image
                source={require('../../assets/mascot/nubo-welcoming-1.png')}
                style={styles.motivationalMascotImage}
              />
            </View>
          </View>

          <View style={styles.buttonRowContainer}>
            <PrimaryButton
              label={t('brushingResultsScreen.goHomeButton')}
              onPress={handleChevronClosePress}
              width={screenWidth * 0.85}
              useDisplayFont={true}
            />
          </View>
        </LightContainer>
      </Animated.View>

      {/* 3. Top left action buttons (dismiss and share) */}
      <Animated.View
        style={[
          styles.topLeftButtonsContainer,
          {
            opacity: animatedContentOpacity,
            top: insets.top + 8, 
          }
        ]}
      >
                 <Pressable
           style={({ pressed }) => [
             styles.topActionButton,
             {
               opacity: pressed ? 0.7 : 1,
               transform: [{ scale: pressed ? 0.90 : 1 }],
             }
           ]}
           onPress={handleOpenConfirmModal}
         >
           <MaterialCommunityIcons name="history" size={26} color={theme.activeColors.text} />
         </Pressable>
         <Pressable
           style={({ pressed }) => [
             styles.topActionButton,
             {
               opacity: pressed ? 0.7 : 1,
               transform: [{ scale: pressed ? 0.90 : 1 }],
             }
           ]}
           onPress={handleShare}
         >
           <Feather name="share-2" size={22} color={theme.activeColors.text} />
         </Pressable>
      </Animated.View>

      {/* 4. The Chevron close button, also absolutely positioned */}
      <Animated.View
        style={[
          styles.closeButtonContainer,
          {
            opacity: animatedContentOpacity,
            top: insets.top + 8, 
          }
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.closeButton, // This is the Pressable's direct style
            {
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.90 : 1 }],
            }
          ]}
          onPress={handleChevronClosePress}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={32}
            color={theme.activeColors.text}
          />
        </Pressable>
      </Animated.View>

      <ConfirmModal
        visible={isConfirmModalVisible}
        title={t('brushingResultsScreen.revertModalTitle')}
        message={t('brushingResultsScreen.revertModalMessage')}
        confirmText={t('brushingResultsScreen.revertModalConfirmButton')}
        cancelText={t('brushingResultsScreen.revertModalCancelButton')}
        onConfirm={handleConfirmRevert}
        onCancel={handleCancelRevert}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  panGestureContainer: {
    flex: 1,
    backgroundColor: 'transparent', // Important: Pan container itself should be transparent
  },
  animatedCircularScaler: { // Renamed from animatedScaler
    position: 'absolute',
    left: screenWidth / 2 - FAB_BUTTON_SIZE / 2,
    bottom: FAB_BOTTOM_POSITION,
    width: FAB_BUTTON_SIZE,
    height: FAB_BUTTON_SIZE,
    borderRadius: FAB_BUTTON_SIZE / 2,
    // backgroundColor is set inline via themedScalerBackgroundColor
    // opacity and transform are set inline
  },
  screenContentWrapper: { // New style for the actual content
    ...StyleSheet.absoluteFillObject, // Makes it cover the screen
    justifyContent: 'space-between', // Ensures top content is at top, bottom content (LightContainer) is at bottom
    // opacity is set inline
    // This view will contain the original layout, so no specific flexbox here unless needed
  },
  // contentWrapper is removed as a style name, its purpose is now screenContentWrapper
  container: { // This was the original root, now might be redundant or apply to screenContentWrapper if needed
    flex: 1,
    justifyContent: 'space-between',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth, 
    height: screenHeight,
    resizeMode: 'cover',
    // zIndex might be needed if there are overlapping issues within screenContentWrapper
  },
  topContentContainerWrapper: {
    alignItems: 'center',
    paddingHorizontal: 20,
    // paddingTop is now dynamic via insets and props
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40, 
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  timeCardContainer: {
    width: '90%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: -20,
    backgroundColor: 'transparent',
    marginTop: 30,
  },
  cardTitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
    color: '#FFFFFF',
  },
  cardText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
    lineHeight: 76,
  },
  bottomLightContainer: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: -65, 
    marginBottom: 20,
  },
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  resultCardContainer: {
    borderRadius: 12,
  },
  resultCardContent: {
    padding: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  metricDonutContainer: {
    width: 55,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: -15,
  },
  flameIconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary[800],
    fontFamily: 'Merienda-Bold',
    lineHeight: 34,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    color: Colors.primary[800],
    marginTop: 2,
  },
  motivationalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginVertical: 10,
    marginBottom: 5,
  },
  textAndProgressContainer: {
    flex: 1,
    marginRight: 15,
  },
  mascotImageContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 10,
  },
  motivationalText: {
    fontSize: 16,
    color: Colors.neutral[800],
    fontFamily: 'Quicksand-Medium',
    textAlign: 'left',
  },
  motivationalMascotImage: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  progressCard: {
    width: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 12,
  },
  cardBlur: {
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
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
  buttonRowContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  leftActionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 25,
    borderWidth: 0,
    // backgroundColor is overridden by inline styles
    justifyContent: 'center',
    alignItems: 'center',
  },

  topLeftButtonsContainer: { 
    position: 'absolute',
    left: 18,
    zIndex: 2000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topActionButton: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonContainer: { 
    position: 'absolute',
    right: 18,
    zIndex: 2000, 
  },
  closeButton: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BrushingResultsScreen; 