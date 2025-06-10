import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable, Animated } from 'react-native';
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

const BrushingResultsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  // Card view states
  const [pointsCardView, setPointsCardView] = useState<'default' | 'details'>('default');
  const [bonusCardView, setBonusCardView] = useState<'default' | 'details'>('default');

  // Animation values for card content switching
  const [pointsCardAnim] = useState(() => new Animated.Value(1));
  const [pointsCardScale] = useState(() => new Animated.Value(1));
  const [bonusCardAnim] = useState(() => new Animated.Value(1));
  const [bonusCardScale] = useState(() => new Animated.Value(1));

  // Simple screen fade animation
  const [screenOpacity] = useState(() => new Animated.Value(0));
  
  // Modal state
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);

  // Card content switching handlers
  const handlePointsCardPress = () => {
    const newView = pointsCardView === 'default' ? 'details' : 'default';
    
    Animated.parallel([
      Animated.timing(pointsCardAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(pointsCardScale, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setPointsCardView(newView);
      Animated.parallel([
        Animated.spring(pointsCardAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(pointsCardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleBonusCardPress = () => {
    const newView = bonusCardView === 'default' ? 'details' : 'default';
    
    Animated.parallel([
      Animated.timing(bonusCardAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(bonusCardScale, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBonusCardView(newView);
      Animated.parallel([
        Animated.spring(bonusCardAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.spring(bonusCardScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Simple fade in animation on mount
  useEffect(() => {
    Animated.timing(screenOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Simple navigation functions
  const navigateToHome = () => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/(home)');
    });
  };

  const navigateToTimer = () => {
    Animated.timing(screenOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/(home)/timer');
    });
  };

  // Button handlers
  const handleClosePress = () => {
    navigateToHome();
  };

  const handleGoHome = () => {
    navigateToHome();
  };

  const handleOpenConfirmModal = () => {
    setIsConfirmModalVisible(true);
  };

  const handleConfirmRevert = () => {
    setIsConfirmModalVisible(false);
    navigateToTimer();
  };

  const handleCancelRevert = () => {
    setIsConfirmModalVisible(false);
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  if (!fontsLoaded) {
    return null;
  }

  const cardWidth = screenWidth * 0.4;
  const cardHeight = 110;
  const brushingMinutes = 2;
  const brushingSeconds = 30;

  const card1Data = { progress: 75, value: "+90", label: "Points" };
  const card2Data = { progress: 100, value: "+200", label: "Bonus" };

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <Image
        source={require('../../assets/images/meshgradient-light-default.png')}
        style={styles.backgroundImage} 
      />
      
      <View style={[styles.topContentContainer, { paddingTop: insets.top + 40 }]}>
        <ThemedText style={styles.title} variant="title">
          {t('brushingResultsScreen.title')}
        </ThemedText>

        <View style={styles.timeCardContainer}>
          <ThemedText style={[styles.cardText, { fontFamily: 'Merienda-Bold' }]}>
            {String(brushingMinutes).padStart(2, '0')}:{String(brushingSeconds).padStart(2, '0')}
          </ThemedText>
          <ThemedText style={styles.cardTitle}>
            {t('brushingResultsScreen.timeSpentCardTitle')}
          </ThemedText>
        </View>
      </View>

      <LightContainer
        style={[
          styles.bottomContainer,
          {
            height: screenHeight / 2.3,
            paddingBottom: insets.bottom + 10,
          }
        ]}
      >
        <View style={styles.cardsRowContainer}>
          <Pressable style={styles.shadowWrapper} onPress={handlePointsCardPress}> 
            <GlassmorphicCard
              width={cardWidth}
              borderRadius="md"
              intensity={60}
              shadow="none"
              containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
              style={styles.resultCardContent}
            >
              <Animated.View style={[styles.metricContentContainer, { 
                opacity: pointsCardAnim,
                transform: [{ scale: pointsCardScale }]
              }]}>
                {pointsCardView === 'default' ? (
                  <>
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
                      <ThemedText style={styles.metricLabel}>
                        {t('brushingResultsScreen.pointsCardLabel')}
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.flippedCardLayout}>
                    <View style={styles.flippedCardTop}>
                      <View style={[styles.metricDonutContainer, styles.flippedNumberContainer]}>
                        <ThemedText style={styles.flippedCardNumber}>0</ThemedText>
                      </View>
                      <View style={styles.metricTextContainer}>
                        <ThemedText style={styles.flippedCardValue}>
                          {t('brushingResultsScreen.pointsCardDetailsValue')}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.flippedCardBottom}>
                      <ThemedText style={styles.flippedCardBottomLabel}>
                        {t('brushingResultsScreen.pointsCardDetailsLabel')}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </Animated.View>
            </GlassmorphicCard>
          </Pressable>

          <Pressable style={styles.shadowWrapper} onPress={handleBonusCardPress}>
            <GlassmorphicCard
              width={cardWidth}
              borderRadius="md"
              intensity={60}
              shadow="none"
              containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
              style={styles.resultCardContent}
            >
              <Animated.View style={[styles.metricContentContainer, { 
                opacity: bonusCardAnim,
                transform: [{ scale: bonusCardScale }]
              }]}>
                {bonusCardView === 'default' ? (
                  <>
                    <View style={styles.metricDonutContainer}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={65}
                        color={Colors.primary[500]}
                      />
                    </View>
                    <View style={styles.metricTextContainer}>
                      <ThemedText style={styles.metricValue}>{card2Data.value}</ThemedText>
                      <ThemedText style={styles.metricLabel}>
                        {t('brushingResultsScreen.bonusCardLabel')}
                      </ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.flippedCardLayout}>
                    <View style={styles.flippedCardTop}>
                      <View style={[styles.metricDonutContainer, styles.flippedNumberContainer]}>
                        <ThemedText style={styles.flippedCardNumber}>5</ThemedText>
                      </View>
                      <View style={styles.metricTextContainer}>
                        <ThemedText style={styles.flippedCardValue}>
                          {t('brushingResultsScreen.bonusCardDetailsValue')}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.flippedCardBottom}>
                      <ThemedText style={styles.flippedCardBottomLabel}>
                        {t('brushingResultsScreen.bonusCardDetailsLabel')}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </Animated.View>
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
            onPress={handleGoHome}
            width={screenWidth * 0.85}
            useDisplayFont={true}
          />
        </View>
      </LightContainer>

      {/* Top left action buttons (dismiss and share) */}
      <View style={[styles.topLeftButtonsContainer, { top: insets.top + 8 }]}>
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
      </View>

      {/* Top right close button */}
      <View style={[styles.closeButtonContainer, { top: insets.top + 8 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.90 : 1 }],
            }
          ]}
          onPress={handleClosePress}
        >
          <MaterialCommunityIcons
            name="chevron-down"
            size={32}
            color={theme.activeColors.text}
          />
        </Pressable>
      </View>

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
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth, 
    height: screenHeight,
    resizeMode: 'cover',
  },
  topContentContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40, 
    marginBottom: 10,
    textAlign: 'center',
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
  bottomContainer: {
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
    marginRight: 8,
  },
  metricTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  metricLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 16,
  },
  flippedCardLayout: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  flippedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flippedNumberContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 30,
    width: 50,
    height: 50,
    marginRight: 8,
  },
  flippedCardNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  flippedCardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  flippedCardBottom: {
    paddingTop: 8,
  },
  flippedCardBottomLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
  },
  motivationalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  textAndProgressContainer: {
    flex: 1,
    marginRight: 15,
  },
  motivationalText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 22,
  },
  progressCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBlur: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  mascotImageContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  motivationalMascotImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  buttonRowContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  topLeftButtonsContainer: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    gap: 10,
    zIndex: 1000,
  },
  topActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    zIndex: 1000,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default BrushingResultsScreen; 