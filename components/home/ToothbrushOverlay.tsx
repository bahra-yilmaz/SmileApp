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
import { useAuth } from '../../context/AuthContext';

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
  const { activeColors } = theme; // Destructure activeColors
  const { stats, simpleDaysInUse, isLoading, refreshStats } = useToothbrushStats();
  const { user } = useAuth();
  
  // Animation values for container
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);

  // State for toothbrush history
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([
    { id: 'h3', date: '2024-03-15' },
    { id: 'h2', date: '2023-12-10' },
    { id: 'h1', date: '2023-09-01' },
  ]);
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;
  
  // Calculate progress percentage and status using comprehensive stats
  const daysInUse = stats?.totalCalendarDays ?? simpleDaysInUse;
  const usageCycles = stats?.totalBrushingSessions ?? Math.floor(daysInUse * 1.5); // Fallback estimation
  
  const maxDays = 90;
  const healthPercentage = Math.max(0, Math.min(100, Math.round((1 - daysInUse / maxDays) * 100)));
  let healthStatus = stats?.replacementText ?? t('toothbrushOverlay.healthStatusGood');
  let healthColor = stats?.replacementColor ?? Colors.feedback.success[theme.colorScheme];
  
  // Use stats for more accurate health calculation if available
  if (stats) {
    healthColor = stats.replacementColor;
    healthStatus = stats.replacementText;
  } else {
    // Fallback logic
    if (daysInUse > maxDays * 0.66) {
      healthStatus = t('toothbrushOverlay.healthStatusReplaceSoon');
      healthColor = Colors.feedback.warning[theme.colorScheme];
    } else if (daysInUse > maxDays * 0.33) {
      healthStatus = t('toothbrushOverlay.healthStatusFair');
      healthColor = Colors.primary[theme.colorScheme === 'dark' ? 400 : 500];
    }
  }
  
  // Force refresh when overlay becomes visible
  useEffect(() => {
    if (isVisible && !isLoading) {
      refreshStats();
    }
  }, [isVisible, refreshStats, isLoading]);

  // Force refresh when user changes (sign in/out)
  useEffect(() => {
    if (user?.id) {
      refreshStats();
    }
  }, [user?.id, refreshStats]);
  
  // Handle animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Set animation complete to false after animation is done
        setAnimationComplete(false);
      });
    }
  }, [isVisible, fadeAnim, scaleAnim]);
  
  const handleClose = () => {
    onClose();
  };
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  return (
    <View style={[StyleSheet.absoluteFill, styles.mainContainer]}>
      {/* Backdrop - covers the entire screen and handles touches outside the overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: fadeAnim,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }
            ]}
          >
            <BlurView
              intensity={20}
              tint={theme.colorScheme}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      {/* Overlay Container - contains the actual overlay content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'position' : 'height'} 
        style={styles.centerContainer} 
        pointerEvents="box-none"
        keyboardVerticalOffset={0}
      >
        <Animated.View 
          style={[
            styles.overlayContainer, 
            {
              width: overlayWidth,
              height: overlayHeight,
              borderRadius: 45,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
              ],
              // Enhanced shadow
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
                backgroundColor: theme.colorScheme === 'dark'
                  ? 'rgba(30, 40, 60, 0.7)' 
                  : 'rgba(255, 255, 255, 0.7)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colorScheme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 45,
              }
            ]}
          />
          
          {/* Content Area: ScrollView for content, separate View for Button */}
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
                  style={[
                    styles.toothbrushTitle,
                    { fontFamily: fontsLoaded ? 'Merienda-Bold' : undefined }
                  ]}
                  variant="subtitle"
                  lightColor={Colors.primary[700]}
                  darkColor={Colors.primary[400]}
                >
                  {t('toothbrushOverlay.title')}
                </ThemedText>
                <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  <ThemedText style={styles.daysInUse}>
                    {`${daysInUse} ${t('toothbrushOverlay.daysInUseText')}`}
                  </ThemedText>
                </View>
              </View>
            </View>
            <View style={[styles.separator, { 
              borderBottomColor: theme.colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)' 
            }]} />
            
            {/* Usage Stats Section */}
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
                <View style={styles.usageSection}>
                  <ThemedText style={styles.usageText}>
                    {t('toothbrushOverlay.brushesOnThisToothbrushText', { count: usageCycles })}
                  </ThemedText>
                  {/* Show indicator if data includes estimates from onboarding */}
                  {stats?.totalCalendarDays && stats.totalCalendarDays > 7 && stats.totalCalendarDays > stats.actualBrushingDays * 1.5 && (
                    <ThemedText style={styles.estimatedDataHint}>
                      {t('toothbrushOverlay.includesEstimatedData', 'Includes estimated historical data')}
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>

            {/* Replace History Section */}
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

            {/* Conditional History List */}
            {showHistory && (
              <View style={styles.historyListContainer}>
                {historyData.map((item, index) => (
                  <View 
                    key={item.id} 
                    style={[
                      styles.historyItem,
                      // Add a separator line unless it's the last item
                      index < historyData.length - 1 && [
                        styles.historyItemSeparator,
                        { 
                          borderBottomColor: theme.colorScheme === 'dark' 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(0, 0, 0, 0.05)'
                        }
                      ]
                    ]}
                  >
                    <ThemedText style={styles.historyItemText}>
                      {t('toothbrushOverlay.replacedOnDate', { date: item.date })}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* NEW Toothbrush Renewal Info Section */}
            <View style={{
              marginHorizontal: 16,
              marginBottom: 16,
              marginTop: 12,
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: theme.colorScheme === 'dark' 
                ? Colors.primary[400] + '60'  
                : Colors.primary[700] + '40',
            }}>
              <ThemedText style={styles.usageTitle}>
                {t('toothbrushOverlay.whyReplaceTitle')}
              </ThemedText>
              <ThemedText style={styles.usageText}>
                {t('toothbrushOverlay.whyReplaceText')}
              </ThemedText>
            </View>

            {/* Toothbrush Health Progress Bar */}
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
                    { 
                      width: `${healthPercentage}%`,
                      backgroundColor: healthColor // Use dynamic health color
                    }
                  ]} 
                />
              </View>
            </View>
          </ScrollView>

          {/* Button Container - Positioned below ScrollView -> Now positioned absolutely */}
          <View style={styles.buttonShadowContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: pressed 
                    ? theme.colorScheme === 'dark' 
                      ? Colors.primary[600] 
                      : Colors.primary[500]
                    : theme.colorScheme === 'dark' 
                      ? Colors.primary[500] 
                      : Colors.primary[600],
                }
              ]}
              onPress={() => {
                console.log('New toothbrush button pressed');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
  usageSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageIcon: {
    marginRight: 8,
  },
  estimatedDataHint: {
    fontSize: 12,
    opacity: 0.7,
    color: Colors.light.icon,
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
    marginTop: 4, // Small gap after the history button
  },
  historyItem: {
    paddingVertical: 10,
    paddingHorizontal: 16, // Indent slightly from container edges
  },
  historyItemSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor will be applied dynamically
  },
  historyItemText: {
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'Quicksand-Regular',
  },
});

export default ToothbrushOverlay; 