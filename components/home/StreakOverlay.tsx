import React, { useEffect, useRef, useState, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable, 
  TouchableWithoutFeedback, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../ThemedText';
import { useTranslation } from 'react-i18next';

interface StreakOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  streakDays: number;
}

export const StreakOverlay: React.FC<StreakOverlayProps> = ({ isVisible, onClose, streakDays }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;
  
  // Animation values for container
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // State for streak history visibility and data
  const [showHistory, setShowHistory] = useState(false);
  // Updated dummy data to represent streak periods
  const [historyData, setHistoryData] = useState([ 
    { id: 'sp1', startDate: '2024-07-16', endDate: '2024-07-20', duration: 5 },
    { id: 'sp2', startDate: '2024-05-01', endDate: '2024-05-03', duration: 3 },
    { id: 'sp3', startDate: '2024-02-10', endDate: '2024-02-11', duration: 2 },
  ]);
  
  // Calculate progress towards next phase (assuming 7-day phases)
  const phaseLength = 7;
  const currentPhaseProgress = streakDays % phaseLength;
  const nextPhaseTarget = Math.ceil((streakDays + 1) / phaseLength) * phaseLength;
  const progressPercentage = Math.min(100, Math.round((currentPhaseProgress / phaseLength) * 100));
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;
  
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
  
  const STREAK_ITEMS_DATA = [
    {
      id: '2',
      name: t('streakOverlay.achievementsTitle'),
      description: t('streakOverlay.achievementsDescription'),
      icon: 'trophy' as keyof typeof MaterialCommunityIcons.glyphMap,
    },
    {
      id: '3',
      name: t('streakOverlay.shareStreakTitle'),
      description: t('streakOverlay.shareStreakDescription'),
      icon: 'share-variant' as keyof typeof MaterialCommunityIcons.glyphMap,
    },
    {
      id: '4',
      name: t('streakOverlay.streakGoalsTitle'),
      description: t('streakOverlay.streakGoalsDescription'),
      icon: 'target' as keyof typeof MaterialCommunityIcons.glyphMap,
    }
  ];
  
  const handleStreakItemPress = (item: typeof STREAK_ITEMS_DATA[0]) => {
    // Handle item press logic - placeholder
    console.log(`Pressed: ${item.name}`);
    // Optionally close overlay or navigate
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
          
          {/* Content Area: Use ScrollView */}
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Integrated Header */}
            <View style={styles.headerContainer}>
              <View style={styles.iconBackdrop}>
                <MaterialCommunityIcons 
                  name="fire" 
                  size={90} 
                  color={theme.colorScheme === 'dark' ? Colors.primary[400] : Colors.primary[700]} 
                />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText
                  style={[
                    styles.streakTitle,
                    { fontFamily: fontsLoaded ? 'Merienda-Bold' : undefined }
                  ]}
                  variant="subtitle"
                  lightColor={Colors.primary[700]}
                  darkColor={Colors.primary[400]}
                >
                  {t('streakOverlay.title', { count: streakDays })}
                </ThemedText>
                <ThemedText style={styles.streakText}> 
                  {t('streakOverlay.subtitle')}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.separator, { 
              borderBottomColor: theme.colorScheme === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)' 
            }]} />

            {/* NEW Continuous Brushings Section */}
            <View style={styles.usageContainer}> 
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={30}
                  color={Colors.primary[500]} 
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('streakOverlay.continuousBrushingsTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                  {/* Placeholder value - replace with actual count */}
                  {t('streakOverlay.continuousBrushingsText', { count: 12 })}{/* TODO: Replace 12 with actual count */}
                </ThemedText>
              </View>
            </View>

            {/* Best Streaks Section */}
            <Pressable 
              style={styles.usageContainer}
              onPress={() => setShowHistory(!showHistory)}
            >
              <View style={styles.usageIconContainer}> 
                <MaterialCommunityIcons
                  name="calendar-check"
                  size={30} 
                  color={Colors.primary[500]} 
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('streakOverlay.streakHistoryTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                   {t('streakOverlay.streakHistorySubtitle')}
                </ThemedText>
              </View>
               <MaterialCommunityIcons
                  name={showHistory ? "chevron-up" : "chevron-down"}
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
                      {t('streakOverlay.streakPeriodText', { startDate: item.startDate, endDate: item.endDate, duration: item.duration })}
                    </ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Set Reminder Section */}
            <Pressable 
              style={styles.usageContainer}
              onPress={() => {
                console.log('Set Reminder pressed');
                // Add navigation or modal logic here
              }}
            >
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons 
                  name="bell-outline" 
                  size={30}
                  color={Colors.primary[500]}
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('streakOverlay.setReminderTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                {t('streakOverlay.setReminderSubtitle')}
                </ThemedText>
              </View>
            </Pressable>

            {/* Nubo Motivation Info Section */}
            <View style={[
              styles.infoBoxContainer, 
              {
                borderColor: theme.colorScheme === 'dark' 
                  ? Colors.primary[400] + '60' 
                  : Colors.primary[700] + '40'
              }
            ]}>
              <View style={styles.infoBoxTextContainer}>
                <ThemedText style={styles.usageTitle}> 
                  {t('streakOverlay.nuboMotivationTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}> 
                {t('streakOverlay.nuboMotivationText')}
                </ThemedText>
              </View>
            </View>

            {/* Progress Bar Section - MOVED HERE (After Info Box) */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelContainer}>
                <ThemedText style={styles.usageTitle}>{t('streakOverlay.nextSummitTitle')}</ThemedText>
                {/* Split text for coloring */}
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                   <ThemedText style={[
                      styles.usageText, 
                      {
                        color: Colors.primary[theme.colorScheme === 'dark' ? 400 : 500], // Apply "Fair" color
                        fontFamily: theme.typography.fonts.medium // Make it slightly bolder maybe?
                       }
                    ]}>
                      {t('streakOverlay.daysToGoText', { count: phaseLength - currentPhaseProgress })}
                    </ThemedText>
                    <ThemedText style={[styles.usageText, { marginLeft: 4 }]}> 
                      ({progressPercentage}%)
                    </ThemedText>
                </View>
              </View>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progressPercentage}%`,
                      backgroundColor: Colors.primary[500] 
                    }
                  ]} 
                />
              </View>
            </View>

          </ScrollView> 
          
          {/* Share Button Container (mimics ToothbrushOverlay) */}
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
                console.log('Share streak button pressed');
                // Add actual share logic here
              }}
            >
              <MaterialCommunityIcons
                  name="share-variant" 
                  size={20} 
                  color="#FFF"
                  style={{ marginRight: 8 }} 
              />
              <ThemedText style={styles.buttonText}>
                {t('streakOverlay.shareStreakTitle')}
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
  streakTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  streakText: {
    fontSize: 16,
    opacity: 0.8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 96,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  separator: {
    borderBottomWidth: 1,
    marginHorizontal: 8,
    marginBottom: 8,
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
  historyListContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
  },
  historyItem: {
    paddingVertical: 10,
    paddingHorizontal: 16, 
  },
  historyItemSeparator: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyItemText: {
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'Quicksand-Regular',
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
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Merienda-Bold',
    marginLeft: 4,
  },
  // --- Styles moved inside StyleSheet.create ---
  infoBoxContainer: {
    flexDirection: 'row', 
    marginHorizontal: 16,
    marginBottom: 16, 
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    // borderColor is set dynamically in component rendering
  },
  infoBoxTextContainer: {
    flex: 1, 
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
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Use theme appropriate color later
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
  },
});

export default StreakOverlay; 