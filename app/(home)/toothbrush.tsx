import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Text, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import GlassmorphicHeader from '../../components/ui/GlassmorphicHeader';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const TOOTHBRUSH_DATA_KEY = 'toothbrush_data';

// Toothbrush interfaces
export interface Toothbrush {
  id: string;
  type: 'manual' | 'electric';
  category: 'regular' | 'braces' | 'sensitive' | 'whitening';
  startDate: string; // ISO date string
  endDate?: string; // ISO date string when replaced
  brand?: string;
  model?: string;
  notes?: string;
}

export interface ToothbrushData {
  current: Toothbrush | null;
  history: Toothbrush[];
}

interface InfoCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export default function ToothbrushScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  // Animation values
  const translateX = useSharedValue(screenWidth);
  const opacity = useSharedValue(0);
  const scrollY = useSharedValue(0);
  
  // State
  const [toothbrushData, setToothbrushData] = useState<ToothbrushData>({ current: null, history: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Info cards about toothbrushes
  const INFO_CARDS: InfoCard[] = [
    {
      id: 'electric_vs_manual',
      title: t('toothbrush.infoCards.electricVsManual.title', 'Electric vs Manual'),
      description: t('toothbrush.infoCards.electricVsManual.description', 'Electric toothbrushes can remove more plaque and are easier on your gums.'),
      icon: 'flash-outline',
      color: '#4A90E2'
    },
    {
      id: 'replacement_time',
      title: t('toothbrush.infoCards.replacementTime.title', 'When to Replace'),
      description: t('toothbrush.infoCards.replacementTime.description', 'Replace your toothbrush every 3-4 months or after illness.'),
      icon: 'time-outline',
      color: '#F39C12'
    },
    {
      id: 'braces_care',
      title: t('toothbrush.infoCards.bracesCare.title', 'Braces Care'),
      description: t('toothbrush.infoCards.bracesCare.description', 'Use soft bristles and consider interdental brushes for braces.'),
      icon: 'medical-outline',
      color: '#E74C3C'
    },
    {
      id: 'sensitive_teeth',
      title: t('toothbrush.infoCards.sensitiveTeeth.title', 'Sensitive Teeth'),
      description: t('toothbrush.infoCards.sensitiveTeeth.description', 'Extra soft bristles help protect sensitive gums and enamel.'),
      icon: 'heart-outline',
      color: '#9B59B6'
    }
  ];

  useEffect(() => {
    // Animate in from the right
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
    
    loadToothbrushData();
  }, []);

  const loadToothbrushData = async () => {
    try {
      setIsLoading(true);
      const storedData = await AsyncStorage.getItem(TOOTHBRUSH_DATA_KEY);
      if (storedData) {
        const data: ToothbrushData = JSON.parse(storedData);
        setToothbrushData(data);
      }
    } catch (error) {
      console.error('Error loading toothbrush data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveToothbrushData = async (data: ToothbrushData) => {
    try {
      await AsyncStorage.setItem(TOOTHBRUSH_DATA_KEY, JSON.stringify(data));
      setToothbrushData(data);
    } catch (error) {
      console.error('Error saving toothbrush data:', error);
      Alert.alert(
        t('toothbrush.error.title', 'Error'),
        t('toothbrush.error.message', 'Failed to save toothbrush data. Please try again.')
      );
    }
  };

  const getCurrentAge = (): { days: number; weeks: number; months: number } => {
    if (!toothbrushData.current) return { days: 0, weeks: 0, months: 0 };
    
    const startDate = new Date(toothbrushData.current.startDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    
    return { days, weeks, months };
  };

  const getAgeDisplayText = () => {
    const age = getCurrentAge();
    if (age.months >= 1) {
      return age.months === 1 
        ? t('toothbrush.age.oneMonth', '1 month')
        : t('toothbrush.age.months', `${age.months} months`);
    } else if (age.weeks >= 1) {
      return age.weeks === 1 
        ? t('toothbrush.age.oneWeek', '1 week')
        : t('toothbrush.age.weeks', `${age.weeks} weeks`);
    } else {
      return age.days === 1 
        ? t('toothbrush.age.oneDay', '1 day')
        : t('toothbrush.age.days', `${age.days} days`);
    }
  };

  const getReplacementStatus = () => {
    const age = getCurrentAge();
    if (age.months >= 4) {
      return { 
        status: 'overdue', 
        text: t('toothbrush.status.overdue', 'Overdue for replacement'),
        color: '#E74C3C' 
      };
    } else if (age.months >= 3) {
      return { 
        status: 'due', 
        text: t('toothbrush.status.due', 'Due for replacement'),
        color: '#F39C12' 
      };
    } else if (age.months >= 2) {
      return { 
        status: 'soon', 
        text: t('toothbrush.status.soon', 'Replace soon'),
        color: '#F39C12' 
      };
    }
    return { 
      status: 'good', 
      text: t('toothbrush.status.good', 'Good condition'),
      color: '#27AE60' 
    };
  };

  const handleNewToothbrush = () => {
    Alert.alert(
      t('toothbrush.newBrush.title', 'New Toothbrush'),
      t('toothbrush.newBrush.message', 'Are you sure you want to mark your current toothbrush as replaced?'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel'
        },
        {
          text: t('toothbrush.newBrush.confirm', 'Yes, New Brush'),
          onPress: createNewToothbrush
        }
      ]
    );
  };

  const createNewToothbrush = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const now = new Date().toISOString();
      const newData: ToothbrushData = { ...toothbrushData };
      
      // Move current to history if exists
      if (newData.current) {
        newData.current.endDate = now;
        newData.history.unshift(newData.current);
      }
      
      // Create new current toothbrush with default values
      newData.current = {
        id: Date.now().toString(),
        type: 'manual', // Default, user can change this later
        category: 'regular',
        startDate: now
      };
      
      await saveToothbrushData(newData);
      
      Alert.alert(
        t('toothbrush.newBrush.success.title', 'New Toothbrush Added'),
        t('toothbrush.newBrush.success.message', 'Your new toothbrush has been registered!')
      );
    } catch (error) {
      console.error('Error creating new toothbrush:', error);
    }
  };

  const handleBackPress = () => {
    translateX.value = withTiming(screenWidth, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    }, () => {
      runOnJS(router.back)();
    });
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    });
  };

  // Gesture handler for swipe-to-go-back
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      if (event.translationX > 0 && event.x < 50) {
        translateX.value = Math.max(0, event.translationX);
      }
    },
    onEnd: (event) => {
      if (event.translationX > 100 && event.velocityX > 0) {
        runOnJS(handleBackPress)();
      } else {
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const renderInfoCard = (card: InfoCard) => (
    <GlassmorphicCard key={card.id} style={[styles.infoCard, { borderLeftColor: card.color }]} width={screenWidth * 0.9}>
      <View style={styles.infoCardContent}>
        <Ionicons name={card.icon as any} size={24} color={card.color} style={styles.infoCardIcon} />
        <View style={styles.infoCardText}>
          <ThemedText style={[styles.infoCardTitle, { color: card.color }]}>
            {card.title}
          </ThemedText>
          <ThemedText style={styles.infoCardDescription}>
            {card.description}
          </ThemedText>
        </View>
      </View>
    </GlassmorphicCard>
  );

  const renderHistoryItem = (brush: Toothbrush, index: number) => {
    const startDate = new Date(brush.startDate);
    const endDate = brush.endDate ? new Date(brush.endDate) : new Date();
    const usageDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return (
      <View key={brush.id} style={styles.historyItem}>
        <View style={styles.historyItemHeader}>
          <Ionicons 
            name={brush.type === 'electric' ? 'flash' : 'brush'} 
            size={20} 
            color={activeColors.tint} 
          />
          <ThemedText style={styles.historyItemTitle}>
            {t(`toothbrush.type.${brush.type}`, brush.type === 'electric' ? 'Electric' : 'Manual')} - {t(`toothbrush.category.${brush.category}`, brush.category)}
          </ThemedText>
        </View>
        <ThemedText style={styles.historyItemDuration}>
          {t('toothbrush.history.used', 'Used for')} {usageDays} {usageDays === 1 ? t('toothbrush.history.day', 'day') : t('toothbrush.history.days', 'days')}
        </ThemedText>
        <ThemedText style={styles.historyItemDate}>
          {startDate.toLocaleDateString()} - {brush.endDate ? endDate.toLocaleDateString() : t('toothbrush.history.current', 'Current')}
        </ThemedText>
      </View>
    );
  };

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <ExpoImage 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: 60 + insets.top + spacing.lg,
              paddingBottom: spacing.lg,
            }
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
          scrollEventThrottle={16}
        >
          {/* Current Toothbrush */}
          <GlassmorphicCard style={styles.currentBrushCard} width={screenWidth * 0.9}>
            <View style={styles.currentBrushHeader}>
              <ThemedText variant="subtitle" style={styles.sectionTitle}>
                {t('toothbrush.current.title', 'Current Toothbrush')}
              </ThemedText>
              {toothbrushData.current && (
                <View style={[styles.statusBadge, { backgroundColor: getReplacementStatus().color }]}>
                  <ThemedText style={styles.statusText}>
                    {getReplacementStatus().text}
                  </ThemedText>
                </View>
              )}
            </View>

            {toothbrushData.current ? (
              <View style={styles.currentBrushInfo}>
                <View style={styles.currentBrushDetails}>
                  <Ionicons 
                    name={toothbrushData.current.type === 'electric' ? 'flash' : 'brush'} 
                    size={48} 
                    color={activeColors.tint} 
                  />
                  <View style={styles.currentBrushText}>
                    <ThemedText style={styles.currentBrushType}>
                      {t(`toothbrush.type.${toothbrushData.current.type}`, toothbrushData.current.type === 'electric' ? 'Electric' : 'Manual')} Toothbrush
                    </ThemedText>
                    <ThemedText style={styles.currentBrushCategory}>
                      {t(`toothbrush.category.${toothbrushData.current.category}`, toothbrushData.current.category)}
                    </ThemedText>
                    <ThemedText style={styles.currentBrushAge}>
                      {t('toothbrush.current.age', 'Age')}: {getAgeDisplayText()}
                    </ThemedText>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.noBrushContainer}>
                <Ionicons name="help-circle-outline" size={48} color={activeColors.textSecondary} />
                <ThemedText style={styles.noBrushText}>
                  {t('toothbrush.current.none', 'No toothbrush registered')}
                </ThemedText>
                <ThemedText style={styles.noBrushSubtext}>
                  {t('toothbrush.current.addFirst', 'Add your first toothbrush to start tracking')}
                </ThemedText>
              </View>
            )}

            <Pressable style={styles.newBrushButton} onPress={handleNewToothbrush}>
              <Ionicons name="add-circle" size={24} color="white" />
              <ThemedText style={styles.newBrushButtonText}>
                {toothbrushData.current 
                  ? t('toothbrush.newBrush.replace', 'Replace Toothbrush')
                  : t('toothbrush.newBrush.add', 'Add Toothbrush')
                }
              </ThemedText>
            </Pressable>
          </GlassmorphicCard>

          <View style={{ height: spacing.md }} />

          {/* History */}
          {toothbrushData.history.length > 0 && (
            <>
              <GlassmorphicCard style={styles.historyCard} width={screenWidth * 0.9}>
                <ThemedText variant="subtitle" style={styles.sectionTitle}>
                  {t('toothbrush.history.title', 'Toothbrush History')}
                </ThemedText>
                {toothbrushData.history.map((brush, index) => renderHistoryItem(brush, index))}
              </GlassmorphicCard>
              
              <View style={{ height: spacing.md }} />
            </>
          )}

          {/* Info Cards */}
          <ThemedText variant="subtitle" style={[styles.sectionTitle, { marginBottom: spacing.sm, alignSelf: 'flex-start', marginLeft: spacing.md }]}>
            {t('toothbrush.infoCards.title', 'Toothbrush Tips')}
          </ThemedText>
          
          {INFO_CARDS.map(renderInfoCard)}
        </ScrollView>
        
        {/* Glassmorphic Header */}
        <GlassmorphicHeader
          title={t('toothbrush.title', 'Toothbrush')}
          onBackPress={handleBackPress}
          textColor="white"
          scrollY={scrollY}
          fadeThreshold={30}
        />
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  currentBrushCard: {
    padding: 20,
  },
  currentBrushHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Quicksand-Bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  currentBrushInfo: {
    marginBottom: 16,
  },
  currentBrushDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBrushText: {
    marginLeft: 16,
    flex: 1,
  },
  currentBrushType: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentBrushCategory: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 4,
  },
  currentBrushAge: {
    fontSize: 14,
    opacity: 0.7,
  },
  noBrushContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBrushText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  noBrushSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  newBrushButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 100, 255, 0.8)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 8,
  },
  newBrushButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  historyCard: {
    padding: 20,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyItemTitle: {
    marginLeft: 8,
    fontWeight: '600',
  },
  historyItemDuration: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  historyItemDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  infoCard: {
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoCardIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoCardText: {
    flex: 1,
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoCardDescription: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 20,
  },
}); 