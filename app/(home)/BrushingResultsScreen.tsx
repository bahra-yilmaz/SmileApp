import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable, Animated } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import ThemedText from '../../components/ThemedText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import DonutChart from '../../components/ui/DonutChart';
import CountUpText from '../../components/ui/CountUpText';
import { Colors } from '../../constants/Colors';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ConfirmModal from '../../components/modals/ConfirmModal';
import { useTranslation } from 'react-i18next';
import { eventBus } from '../../utils/EventBus';
import AnimatedProgressBar from '../../components/ui/AnimatedProgressBar';
import * as Haptics from 'expo-haptics';
import { shareContent } from '../../utils/share';
import { insertBrushingLog, InsertBrushingLogResult } from '../../services/BrushingLogsService';
import { useBrushingGoal } from '../../context/BrushingGoalContext';
import { useAuth } from '../../context/AuthContext';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BrushingResultsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { brushingGoalMinutes } = useBrushingGoal();
  const { user } = useAuth();
  
  // Parse actual time from navigation params, fallback to 0 if not provided
  const actualMinutes = parseInt(params.actualMinutes as string) || 0;
  const actualSeconds = parseInt(params.actualSeconds as string) || 0;
  const actualTimeInSec = parseInt(params.actualTimeInSec as string) || 0;
  
  // State for animations and modal visibility. Start fadeAnim at 0 (invisible).
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  
  // State for brushing log data
  const [brushingLogData, setBrushingLogData] = useState<InsertBrushingLogResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logError, setLogError] = useState<string | null>(null);

  // Add a useEffect to run the fade-in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300, // A nice, smooth fade-in
      useNativeDriver: true,
    }).start();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Save brushing log when component mounts
  useEffect(() => {
    const saveBrushingLog = async () => {
      if (!user?.id || actualTimeInSec <= 0) {
        setIsLoading(false);
        return;
      }

      try {
        const targetTimeInSec = Math.round(brushingGoalMinutes * 60);
        const result = await insertBrushingLog({
          userId: user.id,
          actualTimeInSec,
          targetTimeInSec,
          aimedSessionsPerDay: 2, // Default to 2 sessions per day
        });
        
        setBrushingLogData(result);
        
        // Emit event to refresh dashboard data
        eventBus.emit('brushing-completed');
      } catch (error) {
        console.error('Failed to save brushing log:', error);
        setLogError(error instanceof Error ? error.message : 'Failed to save brushing log');
      } finally {
        setIsLoading(false);
      }
    };

    saveBrushingLog();
  }, [user?.id, actualTimeInSec, brushingGoalMinutes]);

  // --- NAVIGATION HANDLERS ---
  const handleNavigateHome = () => {
    eventBus.emit('close-timer');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => router.back());
  };

  const handleConfirmRevert = () => {
    setIsConfirmModalVisible(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => router.back());
  };

  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  // Card view states and animations
  const [pointsCardView, setPointsCardView] = useState<'default' | 'details'>('default');
  const [bonusCardView, setBonusCardView] = useState<'default' | 'details'>('default');
  const [pointsCardAnim] = useState(() => new Animated.Value(1));
  const [pointsCardScale] = useState(() => new Animated.Value(1));
  const [bonusCardAnim] = useState(() => new Animated.Value(1));
  const [bonusCardScale] = useState(() => new Animated.Value(1));
  
  const handleOpenConfirmModal = () => setIsConfirmModalVisible(true);
  const handleCancelRevert = () => setIsConfirmModalVisible(false);
  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const timeString = `${actualMinutes.toString().padStart(2, '0')}:${actualSeconds
      .toString()
      .padStart(2, '0')}`;
    await shareContent({
      title: t('brushingResultsScreen.title'),
      message: `${t('brushingResultsScreen.message')} – ${timeString} min brushed via SmileApp 🦷✨`,
    });
  };

  // Card content switching handlers
  const handlePointsCardPress = () => {
    const newView = pointsCardView === 'default' ? 'details' : 'default';
    Animated.parallel([
      Animated.timing(pointsCardAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(pointsCardScale, { toValue: 0.95, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setPointsCardView(newView);
      Animated.parallel([
        Animated.spring(pointsCardAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.spring(pointsCardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleBonusCardPress = () => {
    const newView = bonusCardView === 'default' ? 'details' : 'default';
    Animated.parallel([
      Animated.timing(bonusCardAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(bonusCardScale, { toValue: 0.95, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      setBonusCardView(newView);
      Animated.parallel([
        Animated.spring(bonusCardAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
        Animated.spring(bonusCardScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    });
  };



  if (!fontsLoaded) {
    return null;
  }

  // Show loading state while saving brushing log
  if (isLoading) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
        />
        <View style={[styles.centerContainer, { paddingTop: insets.top + 40 }]}>
          <ThemedText style={styles.loadingText}>{t('brushingResultsScreen.saving', 'Saving your brushing session...')}</ThemedText>
        </View>
      </Animated.View>
    );
  }

  // Show error state if saving failed
  if (logError) {
    return (
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <Image
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
        />
        <View style={[styles.centerContainer, { paddingTop: insets.top + 40 }]}>
          <ThemedText style={styles.errorText}>{t('brushingResultsScreen.saveError', 'Failed to save brushing session')}</ThemedText>
          <PrimaryButton
            label={t('common.continue', 'Continue')}
            onPress={handleNavigateHome}
            width={screenWidth * 0.6}
            style={styles.errorButton}
          />
        </View>
      </Animated.View>
    );
  }
  
  const cardWidth = screenWidth * 0.4;
  const cardHeight = 110;
  
  // Calculate progress based on target
  const targetTimeInSec = Math.round(brushingGoalMinutes * 60);
  const progress = Math.min(100, Math.round((actualTimeInSec / targetTimeInSec) * 100));
  
  const card1Data = { 
    progress, 
    value: brushingLogData?.basePoints || 0, 
    label: "Points" 
  };
  const card2Data = { 
    progress: (brushingLogData?.bonusPoints ?? 0) > 0 ? 100 : 0, 
    value: brushingLogData?.bonusPoints ?? 0, 
    label: "Bonus" 
  };

  const motivationalProgress = progress; // Use actual progress percentage

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Image
        source={require('../../assets/images/meshgradient-light-default.png')}
        style={styles.backgroundImage}
      />
      <View style={[styles.topContentContainerWrapper, { paddingTop: insets.top + 40 }]}>
        <ThemedText style={styles.title} variant="title">{t('brushingResultsScreen.title')}</ThemedText>

        <View style={styles.timeCardContainer}>
          <ThemedText style={[styles.cardText, { fontFamily: 'Merienda-Bold' }]}>
            {String(actualMinutes).padStart(2, '0')}:{String(actualSeconds).padStart(2, '0')}
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
                      <CountUpText style={styles.metricValue} value={card1Data.value} prefix="+" />
                      <ThemedText style={styles.metricLabel}>{t('brushingResultsScreen.pointsCardLabel')}</ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.flippedCardLayout}>
                    <View style={styles.flippedCardTop}>
                      <View style={[styles.metricDonutContainer, styles.flippedNumberContainer]}>
                        <ThemedText style={styles.flippedCardNumber}>0</ThemedText>
                      </View>
                      <View style={styles.metricTextContainer}>
                        <ThemedText style={styles.flippedCardValue}>{t('brushingResultsScreen.pointsCardDetailsValue')}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.flippedCardBottom}>
                      <ThemedText style={styles.flippedCardBottomLabel}>{t('brushingResultsScreen.pointsCardDetailsLabel')}</ThemedText>
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
                      <CountUpText style={styles.metricValue} value={card2Data.value} prefix="+" />
                      <ThemedText style={styles.metricLabel}>{t('brushingResultsScreen.bonusCardLabel')}</ThemedText>
                    </View>
                  </>
                ) : (
                  <View style={styles.flippedCardLayout}>
                    <View style={styles.flippedCardTop}>
                      <View style={[styles.metricDonutContainer, styles.flippedNumberContainer]}>
                        <ThemedText style={styles.flippedCardNumber}>5</ThemedText>
                      </View>
                      <View style={styles.metricTextContainer}>
                        <ThemedText style={styles.flippedCardValue}>{t('brushingResultsScreen.bonusCardDetailsValue')}</ThemedText>
                      </View>
                    </View>
                    <View style={styles.flippedCardBottom}>
                      <ThemedText style={styles.flippedCardBottomLabel}>{t('brushingResultsScreen.bonusCardDetailsLabel')}</ThemedText>
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
                <AnimatedProgressBar progress={motivationalProgress} duration={800} />
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
            onPress={handleNavigateHome}
            width={screenWidth * 0.85}
            useDisplayFont={true}
          />
        </View>
      </LightContainer>

      <View
        style={[
          styles.topLeftButtonsContainer,
          {
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
      </View>

      <View
        style={[
          styles.closeButtonContainer,
          {
            top: insets.top + 8,
          }
        ]}
      >
        <Pressable
          style={({ pressed }) => [
            styles.closeButton,
            {
              opacity: pressed ? 0.7 : 1,
              transform: [{ scale: pressed ? 0.90 : 1 }],
            }
          ]}
          onPress={handleNavigateHome}
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
        icon={<MaterialCommunityIcons name="history" size={36} color={Colors.primary[600]} />}
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
  topContentContainerWrapper: {
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
  buttonRowContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
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
  flippedCardNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.primary[500],
    fontFamily: 'Merienda-Bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 72,
    includeFontPadding: false,
  },
  flippedCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[800],
    fontFamily: 'Quicksand-Bold',
    lineHeight: 24,
  },
  flippedNumberContainer: {
    width: 70,
    height: 85,
    marginLeft: -10,
    marginRight: -5,
    paddingTop: 10,
    overflow: 'visible',
  },
  flippedCardLayout: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  flippedCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginTop: -8,
  },
  flippedCardBottom: {
    position: 'absolute',
    bottom: 4,
    right: 8,
  },
  flippedCardBottomLabel: {
    fontSize: 11,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    color: Colors.primary[800],
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 18,
    fontFamily: 'Quicksand-Medium',
    color: Colors.neutral[800],
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: Colors.feedback.error.light,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorButton: {
    marginTop: 10,
  },
});

export default BrushingResultsScreen; 