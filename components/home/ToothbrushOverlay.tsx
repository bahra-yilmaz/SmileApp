import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
  Image,
  Pressable,
  ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../ThemedText';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { useToothbrushStats } from '../../hooks/useToothbrushStats';
import { ToothbrushDataService } from '../../services/toothbrush/ToothbrushDataService';
import { Toothbrush } from '../../services/toothbrush/ToothbrushTypes';
import { ToothbrushService } from '../../services/toothbrush/ToothbrushService';
import { format } from 'date-fns';
import { eventBus } from '../../utils/EventBus';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';

interface ToothbrushOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ToothbrushOverlay: React.FC<ToothbrushOverlayProps> = ({ 
  isVisible, 
  onClose, 
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { user } = useAuth();
  const router = useRouter();
  const { stats, displayData, currentToothbrush, isLoading, refreshStats } = useToothbrushStats();
  
  // Animation values
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  
  // UI state
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Real history data from backend
  const [historyData, setHistoryData] = useState<Toothbrush[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;

  // Use derived data from the hook
  const daysInUse = displayData?.daysInUse ?? 0;
  const healthPercentage = displayData?.healthPercentage ?? 100;
  const healthStatus = displayData?.healthStatusText ?? t('common.loading');
  const healthColor = displayData?.healthColor ?? Colors.primary[500];
  const usageCycles = stats?.totalBrushingSessions ?? 0;

  // Function to fetch toothbrush history
  const fetchToothbrushHistory = async () => {
    if (!user?.id || user.id === 'guest') {
      setHistoryData([]);
      return;
    }

    try {
      setIsLoadingHistory(true);
      const allData = await ToothbrushService.getAllToothbrushData(user.id);
      
      // Filter history items that have end dates (replacement dates)
      const historyWithEndDates = allData.history.filter(brush => brush.endDate);
      
      // Sort by end date (most recent first)
      const sortedHistory = historyWithEndDates.sort((a, b) => {
        if (!a.endDate || !b.endDate) return 0;
        return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
      });
      
      setHistoryData(sortedHistory);
      console.log('📋 Fetched toothbrush history:', sortedHistory.length, 'items');
    } catch (error) {
      console.error('❌ Error fetching toothbrush history:', error);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Refresh data when the overlay becomes visible
  useEffect(() => {
    if (isVisible) {
      refreshStats();
      fetchToothbrushHistory();
    }
  }, [isVisible, refreshStats, user?.id]);

  // Listen to global events that should trigger toothbrush data refresh
  useEffect(() => {
    const handleBrushingCompleted = () => {
      if (isVisible) {
        console.log('🦷 ToothbrushOverlay: Brushing completed, refreshing toothbrush data...');
        refreshStats();
      }
    };

    const handleFrequencyUpdated = () => {
      if (isVisible) {
        console.log('🦷 ToothbrushOverlay: Frequency updated, refreshing toothbrush data...');
        refreshStats();
      }
    };

    const handleGoalUpdated = () => {
      if (isVisible) {
        console.log('🦷 ToothbrushOverlay: Goal updated, refreshing toothbrush data...');
        refreshStats();
      }
    };

    const handleToothbrushUpdated = (payload: any) => {
      if (isVisible && (payload?.userId === user?.id || payload?.userId === 'guest')) {
        console.log('🦷 ToothbrushOverlay: Toothbrush updated, refreshing data and history...', payload);
        refreshStats();
        fetchToothbrushHistory(); // Also refresh history when toothbrushes are updated
      }
    };

    const unsubscribeBrushing = eventBus.on('brushing-completed', handleBrushingCompleted);
    const unsubscribeFrequency = eventBus.on('frequency-updated', handleFrequencyUpdated);
    const unsubscribeGoal = eventBus.on('brushing-goal-updated', handleGoalUpdated);
    const unsubscribeToothbrush = eventBus.on('toothbrush-updated', handleToothbrushUpdated);

    return () => {
      unsubscribeBrushing();
      unsubscribeFrequency();
      unsubscribeGoal();
      unsubscribeToothbrush();
    };
  }, [isVisible, refreshStats, user?.id]);

  // Handle enter/exit animations
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.95, duration: 250, useNativeDriver: true }),
      ]).start(() => setAnimationComplete(false));
    }
  }, [isVisible, fadeAnim, scaleAnim]);
  
  const handleClose = () => {
    onClose();
  };

  const getToothbrushName = () => {
    if (!currentToothbrush) return t('toothbrushOverlay.title');
    
    // Use name if available, otherwise fall back to type
    if (currentToothbrush.name && currentToothbrush.name.trim()) {
      return currentToothbrush.name;
    }
    
    return `${t(`toothbrush.type.${currentToothbrush.type}`)} ${t('toothbrush.item')}`;
  };

  const getAgeText = () => {
    const weeks = Math.floor(daysInUse / 7);
    const months = Math.floor(daysInUse / 30);

    if (months > 0) {
      return months === 1 
        ? t('toothbrush.age.oneMonth', { count: months })
        : t('toothbrush.age.months', { count: months });
    }
    if (weeks > 0) {
      return weeks === 1
        ? t('toothbrush.age.oneWeek', { count: weeks })
        : t('toothbrush.age.weeks', { count: weeks });
    }
    return daysInUse === 1
      ? t('toothbrush.age.oneDay', { count: daysInUse })
      : t('toothbrush.age.days', { count: daysInUse });
  };
  
  if (!isVisible && !animationComplete) return null;
  
  return (
    <View style={[StyleSheet.absoluteFill, styles.mainContainer]}>
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
            <BlurView intensity={20} tint={theme.colorScheme} style={StyleSheet.absoluteFill} />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'position' : 'height'} 
        style={styles.centerContainer} 
        pointerEvents="box-none"
      >
        <Animated.View 
          style={[
            styles.overlayContainer, 
            {
              width: overlayWidth,
              height: overlayHeight,
              borderRadius: 45,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 20,
              borderWidth: 0,
              overflow: 'hidden',
            }
          ]}
        >
          <BlurView
            intensity={70}
            tint={theme.colorScheme}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colorScheme === 'dark' ? 'rgba(30, 40, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 45,
              }
            ]}
          />
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <View style={styles.iconBackdrop}>
                <Image
                  source={require('../../assets/images/toothbrush.png')}
                  style={styles.toothbrushImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText
                  style={[styles.toothbrushTitle, { fontFamily: fontsLoaded ? 'Merienda-Bold' : undefined }]}
                  variant="subtitle"
                  lightColor={Colors.primary[700]}
                  darkColor={Colors.primary[400]}
                >
                  {getToothbrushName()}
                </ThemedText>
                <ThemedText style={styles.daysInUse}>
                  {getAgeText()}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.separator, { borderBottomColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]} />
            
            <View style={styles.usageContainer}>
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons
                  name="chart-timeline-variant" 
                  size={30}
                  color={theme.colorScheme === 'dark' ? Colors.primary[400] : Colors.primary[700]}
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('toothbrushOverlay.brushingTrackerTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                  {t('toothbrushOverlay.brushesOnThisToothbrushText', { count: usageCycles })}
                </ThemedText>
              </View>
            </View>

            <Pressable 
              style={styles.usageContainer} 
              onPress={() => {
                setShowHistory(!showHistory);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons
                  name="history" 
                  size={30}
                  color={theme.colorScheme === 'dark' ? Colors.primary[400] : Colors.primary[700]}
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('toothbrushOverlay.replaceHistoryTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                  {t('toothbrushOverlay.replaceHistorySubtitle')}
                </ThemedText>
              </View>
              <MaterialCommunityIcons 
                name={showHistory ? "chevron-down" : "chevron-right"}
                size={24}
                color={activeColors.textSecondary}
                style={{ marginLeft: 8 }}
              />
            </Pressable>

            {showHistory && (
              <View style={styles.historyListContainer}>
                {isLoadingHistory ? (
                  <View style={styles.historyItem}>
                    <ThemedText style={[styles.historyItemText, { opacity: 0.6 }]}>
                      {t('common.loading', 'Loading...')}
                    </ThemedText>
                  </View>
                ) : historyData.length > 0 ? (
                  historyData.map((item, index) => (
                    <View 
                      key={item.id} 
                      style={[
                        styles.historyItem,
                        index < historyData.length - 1 && [
                          styles.historyItemSeparator,
                          { borderBottomColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
                        ]
                      ]}
                    >
                      <View style={styles.historyItemContent}>
                        <ThemedText style={styles.historyItemText}>
                          {item.endDate 
                            ? t('toothbrushOverlay.replacedOnDate', { 
                                date: format(new Date(item.endDate), 'PPP') 
                              })
                            : t('toothbrushOverlay.replacedOnDate', { date: 'Unknown' })
                          }
                        </ThemedText>
                        <ThemedText style={[styles.historyItemText, { fontSize: 12, opacity: 0.6, marginTop: 0, lineHeight: 16 }]}>
                          {item.name?.trim() || 
                            `${t(`toothbrush.type.${item.type}`)} ${t('toothbrush.item')}`
                          }
                        </ThemedText>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.historyItem}>
                    <ThemedText style={[styles.historyItemText, { opacity: 0.6 }]}>
                      {t('toothbrushOverlay.noHistoryYet', 'No replacement history yet')}
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            <View style={styles.infoBox}>
              <ThemedText style={styles.usageTitle}>
                {t('toothbrushOverlay.whyReplaceTitle')}
              </ThemedText>
              <ThemedText style={styles.usageText}>
                {t('toothbrushOverlay.whyReplaceText')}
              </ThemedText>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressLabelContainer}>
                <ThemedText style={styles.usageTitle}>{t('toothbrushOverlay.toothbrushHealthTitle')}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <ThemedText style={[styles.usageText, { color: healthColor, fontFamily: theme.typography.fonts.medium }]}>
                    {healthStatus}
                  </ThemedText>
                  <ThemedText style={[styles.usageText, {textAlign: 'right', marginLeft: 4}]}>
                    ({healthPercentage}%)
                  </ThemedText>
                </View>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${healthPercentage}%`, backgroundColor: healthColor }
                  ]} 
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonShadowContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed 
                    ? theme.colorScheme === 'dark' ? Colors.primary[600] : Colors.primary[500]
                    : theme.colorScheme === 'dark' ? Colors.primary[500] : Colors.primary[600],
                }
              ]}
              onPress={() => {
                console.log('New toothbrush button pressed - navigating to settings');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                
                // Close the overlay first
                onClose();
                
                // Navigate to settings with parameter to auto-open toothbrush modal
                router.push('/(home)/settings?openToothbrushModal=true');
              }}
            >
              <MaterialCommunityIcons
                name="autorenew"
                size={20} 
                color="#FFF"
                style={{ marginRight: 8 }} 
              />
              <ThemedText style={styles.buttonText}>
                {t('toothbrushOverlay.gotNewBrushButton')}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 1000,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    overflow: 'hidden',
    flexDirection: 'column',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  iconBackdrop: {
    width: 90,
    height: 90,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  headerTextContainer: {
    flex: 1,
  },
  toothbrushTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  daysInUse: {
    fontSize: 16,
    opacity: 0.8,
  },
  toothbrushImage: {
    width: 110,
    height: 110,
    marginBottom: -20,
  },
  separator: {
    borderBottomWidth: 1,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 0,
  },
  usageIconContainer: {
    marginRight: 16,
  },
  usageTextContainer: {
    flex: 1,
  },
  usageTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    marginBottom: 2,
  },
  usageText: {
    fontSize: 14,
    opacity: 0.8,
  },
  infoBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Will be themed later
  },
  progressContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  buttonShadowContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    borderRadius: 30,
  },
  button: {
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    padding: 16,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Merienda-Bold',
  },
  historyListContainer: {
    marginHorizontal: 16, 
    marginBottom: 16, 
    marginTop: 4,
  },
  historyItem: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  historyItemSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyItemText: {
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'Quicksand-Regular',
    lineHeight: 18,
  },
  historyItemContent: {
    flex: 1,
  },
});

export default ToothbrushOverlay; 