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
  Image,
  TextInput,
  Alert,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../ThemedText';
import DonutChart from '../ui/DonutChart';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { shareContent } from '../../utils/share';
import { useBrushingGoal } from '../../context/BrushingGoalContext';

interface BrushingTimeOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  minutes: number;
  seconds: number;
}

// Define common target time options (in minutes)
const TARGET_TIME_OPTIONS = [1.5, 2, 3, 4];

export const BrushingTimeOverlay: React.FC<BrushingTimeOverlayProps> = ({ 
  isVisible, 
  onClose, 
  minutes, 
  seconds,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { brushingGoalMinutes, setBrushingGoalMinutes } = useBrushingGoal();
  
  // Animation values for container
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // State for target time options visibility
  const [isTargetOptionsVisible, setIsTargetOptionsVisible] = useState(false);
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Regular': require('../../assets/fonts/Quicksand-Regular.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;
  
  // Calculate progress as a percentage
  const progress = ((minutes + seconds / 60) / brushingGoalMinutes) * 100;
  
  // Handle animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      setIsTargetOptionsVisible(false); // Collapse options when overlay opens
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
    // No keyboard to dismiss
    setIsTargetOptionsVisible(false); // Collapse options on close
    onClose();
  };
  
  // Handler for selecting a predefined target time
  const handleSelectTargetTime = async (newTarget: number) => {
    try {
      await setBrushingGoalMinutes(newTarget);
      setIsTargetOptionsVisible(false); // Collapse options after selection
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error setting brushing goal:', error);
    }
  };
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  // Placeholder for trend data - replace with actual logic
  const trendIcon = 'trending-up'; // or 'trending-down' or 'trending-neutral'
  const trendText = t('brushingTimeOverlay.averageTimeImproving');
  
  // Calculate remaining time
  const totalSecondsBrushed = minutes * 60 + seconds;
  const targetTotalSeconds = brushingGoalMinutes * 60;
  const remainingSeconds = Math.max(0, targetTotalSeconds - totalSecondsBrushed);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const remainingSecondsPart = remainingSeconds % 60;
  const remainingTimeString = `${remainingMinutes}:${remainingSecondsPart < 10 ? '0' : ''}${remainingSecondsPart}`;
  
  return (
    <View style={[StyleSheet.absoluteFill, styles.mainContainer]}>
      {/* Backdrop - covers the entire screen and handles touches outside the overlay */}
      <TouchableWithoutFeedback onPress={handleClose} accessible={false}>
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
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.centerContainer} 
        pointerEvents="box-none"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
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
            {/* Integrated Header - Updated */}
            <View style={styles.headerContainer}>
              <View style={styles.iconBackdrop}>
                <DonutChart
                  progress={progress}
                  size={80}
                  thickness={14}
                  progressColor={theme.colorScheme === 'dark' ? Colors.primary[400] : Colors.primary[700]}
                  style={styles.timeDonut}
                />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText
                  style={[
                    styles.brushingTimeTitle,
                    { fontFamily: fontsLoaded ? 'Merienda-Bold' : undefined }
                  ]}
                  variant="subtitle"
                  lightColor={Colors.primary[700]}
                  darkColor={Colors.primary[400]}
                >
                  {t('brushingTimeOverlay.title')}
                </ThemedText>
                <ThemedText style={styles.timeText}>
                  {t('brushingTimeOverlay.timeProgressFormat', { 
                    currentTime: `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`, 
                    targetTime: brushingGoalMinutes === 1.5 ? '1:30' : `${brushingGoalMinutes}:00` 
                  })}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.separator, { 
              borderBottomColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' 
            }, { marginBottom: 8 }]} />

            {/* NEW Brushing Trend Section */}
            <View style={styles.usageContainer}> 
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons
                  name={trendIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={30}
                  color={Colors.primary[500]} 
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('brushingTimeOverlay.brushingTrendTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                  {trendText}
                </ThemedText>
              </View>
            </View>

            {/* Set Target Time Section - Now Expandable */}
            <Pressable 
              style={styles.usageContainer}
              onPress={() => {
                setIsTargetOptionsVisible(!isTargetOptionsVisible);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }} // Toggle visibility
            >
              <View style={styles.usageIconContainer}>
                <MaterialCommunityIcons 
                  name={"clock-time-three-outline"}
                  size={30} 
                  color={Colors.primary[500]} 
                />
              </View>
              <View style={styles.usageTextContainer}>
                <ThemedText style={styles.usageTitle}>
                  {t('brushingTimeOverlay.targetTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}>
                  {t('brushingTimeOverlay.targetDescriptionFormat', { 
                    targetMinutes: brushingGoalMinutes === 1.5 ? '1:30' : `${brushingGoalMinutes}` 
                  })}
                </ThemedText>
              </View>
              {/* Removed chevron icon as row itself is not interactive */}
              <MaterialCommunityIcons
                name={isTargetOptionsVisible ? "chevron-down" : "chevron-right"} // Toggle icon
                size={24}
                color={activeColors.textSecondary}
                style={{ marginLeft: 8 }} 
              />
            </Pressable>

            {/* Target Time Options - Conditionally Rendered */}
            {isTargetOptionsVisible && (
              <View style={styles.targetOptionsContainer}>
                {TARGET_TIME_OPTIONS.map((option) => {
                  const isSelected = option === brushingGoalMinutes;
                  return (
                    <Pressable
                      key={option}
                      style={({ pressed }) => [
                        styles.targetOptionButton,
                        isSelected 
                          ? { backgroundColor: Colors.primary[500] } 
                          : { backgroundColor: activeColors.backgroundSecondary },
                        pressed && { opacity: 0.8 }
                      ]}
                      onPress={() => handleSelectTargetTime(option)}
                    >
                      <ThemedText 
                        style={[
                          styles.targetOptionText,
                          isSelected && { color: '#FFFFFF' } // White text when selected
                        ]}
                      >
                        {option === 1.5 ? '1:30' : `${option}:00`}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Refactored Brushing Technique Info Section */}
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
                  {t('brushingTimeOverlay.whyTimeMattersTitle')}
                </ThemedText>
                <ThemedText style={styles.usageText}> 
                  {t('brushingTimeOverlay.whyTimeMattersText')}
                </ThemedText>
              </View>
            </View>
            
            {/* Progress Bar Section - Added */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelContainer}>
                <ThemedText style={styles.usageTitle}>{t('brushingTimeOverlay.targetProgressTitle')}</ThemedText>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  {remainingSeconds > 0 && (
                    <ThemedText style={[
                       styles.usageText, 
                       {
                         color: Colors.primary[theme.colorScheme === 'dark' ? 400 : 500], 
                         fontFamily: theme.typography.fonts.medium
                       }
                     ]}>
                       {t('brushingTimeOverlay.timeToGoFormat', { time: remainingTimeString })}
                     </ThemedText>
                  )}
                  <ThemedText style={[styles.usageText, { marginLeft: remainingSeconds > 0 ? 4 : 0 }]}> 
                    ({Math.round(progress)}%)
                  </ThemedText>
                </View>
              </View>
              <View style={[styles.progressBarBackground, { backgroundColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }]}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${Math.min(100, Math.max(0, progress))}%`, // Ensure width is between 0-100
                      backgroundColor: Colors.primary[500] // Consistent color
                    }
                  ]} 
                />
              </View>
            </View>

          </ScrollView> 
          
          {/* Share Button Container - Added */}
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
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                const durationString = `${minutes.toString().padStart(2, '0')}:${seconds
                  .toString()
                  .padStart(2, '0')}`;
                await shareContent({
                  title: t('brushingTimeOverlay.shareStatsButton'),
                  message: `${t('brushingTimeOverlay.title')}: ${durationString} min — tracked via SmileApp 🦷✨`,
                });
              }}
            >
              <MaterialCommunityIcons
                  name="share-variant" 
                  size={20} 
                  color="#FFF"
                  style={{ marginRight: 8 }} 
              />
              <ThemedText style={styles.buttonText}>
                {t('brushingTimeOverlay.shareStatsButton')}
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
    paddingTop: 20,
    paddingBottom: 10,
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
  timeDonut: {
    margin: 0,
  },
  headerTextContainer: {
    flex: 1,
  },
  brushingTimeTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  timeText: {
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
  separator: {
    borderBottomWidth: 1, 
    marginHorizontal: 8, 
    marginBottom: 8,
  },
  usageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginBottom: 0,
  },
  usageIconContainer: {
    marginRight: 16,
    width: 30,
    alignItems: 'center',
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
    fontFamily: 'Quicksand-Regular',
    opacity: 0.8,
  },
  infoBoxContainer: {
    flexDirection: 'row', 
    marginHorizontal: 16,
    marginBottom: 16, 
    marginTop: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
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
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 10,
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
  targetOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Distribute buttons evenly
    paddingHorizontal: 16, // Full width container
    marginTop: 4,
    marginBottom: 16,
    gap: 8, // Add small gap between buttons
  },
  targetOptionButton: {
    flex: 1, // Make buttons equal width
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary[500], // Use primary color for border
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetOptionText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    // Color is set dynamically based on selection
  },
});

export default BrushingTimeOverlay; 