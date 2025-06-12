import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Alert, ScrollView } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { cardStyles, buttonStyles } from '../utils/sharedStyles';
import InlineToothbrushPicker from './InlineToothbrushPicker';
import ReminderItem, { ReminderTime, ReminderItemRef } from './ReminderItem';

const { width: screenWidth } = Dimensions.get('window');
const TOOTHBRUSH_DATA_KEY = 'toothbrush_data';

export interface Toothbrush {
  id: string;
  /** User provided label for quick identification */
  name?: string;
  type: 'manual' | 'electric';
  category: 'regular' | 'braces' | 'sensitive' | 'whitening';
  startDate: string;
  endDate?: string;
  brand?: string;
  model?: string;
}

export interface ToothbrushData {
  current: Toothbrush | null;
  history: Toothbrush[];
}

interface ToothbrushManagerProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (data: ToothbrushData) => void;
  autoClose?: boolean;
}

export default function ToothbrushManager({ 
  visible, 
  onClose, 
  onUpdate,
  autoClose = false 
}: ToothbrushManagerProps) {
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { t } = useTranslation();
  
  // Expandable menu state
  const [showToothbrushPicker, setShowToothbrushPicker] = useState(false);
  const [toothbrushConfig, setToothbrushConfig] = useState({
    type: 'manual' as 'manual' | 'electric',
    category: 'regular' as 'regular' | 'braces' | 'sensitive' | 'whitening',
    name: '',
    brand: '',
    model: '',
    isUsed: false,
    ageDays: 0,
  });
  
  // Animation values
  const plusRotation = useSharedValue(0);
  const pickerOpacity = useSharedValue(0);
  const pickerScale = useSharedValue(0.95);
  
  const plusAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${plusRotation.value}deg` }],
  }));

  const [toothbrushData, setToothbrushData] = useState<ToothbrushData>({ current: null, history: [] });
  // track expanded info card ids
  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());

  // refs to close swipe when editing
  const historyItemRefs = useRef<{ [key: string]: ReminderItemRef | null }>({});

  useEffect(() => {
    if (visible) {
      loadToothbrushData();
    }
  }, [visible]);

  const loadToothbrushData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(TOOTHBRUSH_DATA_KEY);
      if (storedData) {
        const data: ToothbrushData = JSON.parse(storedData);
        setToothbrushData(data);
      }
    } catch (error) {
      console.error('Error loading toothbrush data:', error);
    }
  };

  const saveToothbrushData = async (data: ToothbrushData) => {
    try {
      await AsyncStorage.setItem(TOOTHBRUSH_DATA_KEY, JSON.stringify(data));
      setToothbrushData(data);
      if (onUpdate) {
        onUpdate(data);
      }
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

  /**
   * Returns human-friendly status label & color based on toothbrush age.
   * Dental guidelines suggest replacing every ~90 days.
   * We therefore expose a few granular buckets so the user gets clearer feedback.
   */
  const getReplacementStatus = () => {
    let totalDays = 0;
    if (toothbrushData.current) {
      const startDate = new Date(toothbrushData.current.startDate);
      const now = new Date();
      totalDays = Math.ceil(Math.abs(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    if (totalDays < 7) {
      return { status: 'brand_new', text: t('toothbrush.status.brandNew', 'Brand New'), color: '#1ABC9C' };
    }

    if (totalDays < 30) {
      return { status: 'fresh', text: t('toothbrush.status.fresh', 'Fresh'), color: '#2ECC71' };
    }

    if (totalDays < 60) {
      return { status: 'good', text: t('toothbrush.status.good', 'Good'), color: '#27AE60' };
    }

    if (totalDays < 90) {
      return { status: 'replace_soon', text: t('toothbrush.status.due', 'Replace Soon'), color: '#F39C12' };
    }

    return { status: 'overdue', text: t('toothbrush.status.overdue', 'Overdue'), color: '#E74C3C' };
  };

  const handleAddToothbrushPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // If picker is already open, close it
    if (showToothbrushPicker) {
      handleCancelToothbrushAdd();
      return;
    }
    
    // Reset config to defaults
    setToothbrushConfig({
      type: 'manual',
      category: 'regular',
      name: '',
      brand: '',
      model: '',
      isUsed: false,
      ageDays: 0,
    });
    
    setShowToothbrushPicker(true);
    
    // Animate picker in
    pickerOpacity.value = withTiming(1, { duration: 300 });
    pickerScale.value = withTiming(1, { duration: 300 });
    
    // Rotate plus to X
    plusRotation.value = withTiming(45, { duration: 200 });
  };

  const handleCancelToothbrushAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate picker out
    pickerOpacity.value = withTiming(0, { duration: 200 });
    pickerScale.value = withTiming(0.95, { duration: 250 });
    
    // Rotate X back to plus
    plusRotation.value = withTiming(0, { duration: 200 });
    
    // Reset state after animation
    setTimeout(() => {
      setShowToothbrushPicker(false);
      setToothbrushConfig({
        type: 'manual',
        category: 'regular',
        name: '',
        brand: '',
        model: '',
        isUsed: false,
        ageDays: 0,
      });
    }, 250);
  };

  const handleSaveToothbrush = async () => {
    try {
      const now = new Date().toISOString();
      const newData: ToothbrushData = { ...toothbrushData };
      
      // Move current brush to history if exists
      if (newData.current) {
        newData.current.endDate = now;
        newData.history.unshift(newData.current);
      }
      
      // Compute start date based on age offset
      const nowMs = Date.now();
      const startDateIso = new Date(
        nowMs - (toothbrushConfig.ageDays || 0) * 24 * 60 * 60 * 1000
      ).toISOString();
      
      // Create new toothbrush with config
      newData.current = {
        id: Date.now().toString(),
        type: toothbrushConfig.type,
        category: toothbrushConfig.category,
        name: toothbrushConfig.name || undefined,
        startDate: startDateIso,
        brand: toothbrushConfig.brand || undefined,
        model: toothbrushConfig.model || undefined,
      };
      
      await saveToothbrushData(newData);
      
      // Animate picker out
      pickerOpacity.value = withTiming(0, { duration: 200 });
      pickerScale.value = withTiming(0.95, { duration: 250 });
      
      // Rotate X back to plus
      plusRotation.value = withTiming(0, { duration: 200 });
      
      // Reset state after animation
      setTimeout(() => {
        setShowToothbrushPicker(false);
        setToothbrushConfig({
          type: 'manual',
          category: 'regular',
          name: '',
          brand: '',
          model: '',
          isUsed: false,
          ageDays: 0,
        });
      }, 250);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (autoClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating new toothbrush:', error);
    }
  };

  const renderCurrentBrush = () => {
    if (!toothbrushData.current) {
      return (
        <View style={[styles.toothbrushCard, cardStyles.secondaryCard]}>
          <View style={styles.noBrushContainer}>
            <ExpoImage 
              source={require('../assets/images/toothbrush.png')}
              style={[styles.toothbrushImage, { opacity: 0.4 }]}
              contentFit="contain"
            />
            <View style={styles.noBrushTextContainer}>
              <ThemedText style={styles.noBrushText}>
                {t('toothbrush.current.none', 'No toothbrush registered')}
              </ThemedText>
              <ThemedText style={styles.noBrushSubtext}>
                {t('toothbrush.current.addFirst', 'Add your first toothbrush to start tracking')}
              </ThemedText>
            </View>
          </View>
        </View>
      );
    }

    const status = getReplacementStatus();
    
          return (
        <View style={[styles.toothbrushCard, cardStyles.secondaryCard]}>
          <View style={styles.toothbrushCardContent}>
          <View style={styles.toothbrushIconContainer}>
            <ExpoImage 
              source={require('../assets/images/toothbrush.png')}
              style={styles.toothbrushImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.toothbrushTextContainer}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.toothbrushCardTitle} numberOfLines={2}>
                {toothbrushData.current.name 
                  ? toothbrushData.current.name 
                  : `${t(`toothbrush.type.${toothbrushData.current.type}`, toothbrushData.current.type === 'electric' ? 'Electric' : 'Manual')} Toothbrush`}
              </ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}> 
                <ThemedText style={styles.statusText}>{status.text}</ThemedText>
              </View>
            </View>
            <ThemedText style={styles.toothbrushCardSubtitle}>
              {t(`toothbrush.category.${toothbrushData.current.category}`, toothbrushData.current.category)}
            </ThemedText>
            <View style={styles.ageRow}>
              <ThemedText style={styles.toothbrushCardAge}>
                {t('toothbrush.current.age', 'Age')}: {getAgeDisplayText()}
              </ThemedText>
              {toothbrushData.history.length > 0 && (
                <ThemedText style={styles.toothbrushCardHistoryRight}>
                  {toothbrushData.history.length} {toothbrushData.history.length === 1 ? 'brushing' : 'brushings'}
                </ThemedText>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Info cards about toothbrushes
  const INFO_CARDS = [
    {
      id: 'plaque_removal',
      title: t('toothbrush.infoCards.plaqueRemoval.title', 'Plaque Removal 101'),
      description: t(
        'toothbrush.infoCards.plaqueRemoval.description',
        'Clinical trials show electric brushes with oscillating–rotating heads remove up to 21% more plaque after 3 months compared with manual brushes (Cochrane Review 2020).'
      ),
      icon: 'flash-outline',
      color: '#4A90E2',
    },
    {
      id: 'replace_interval',
      title: t('toothbrush.infoCards.replaceInterval.title', 'Change Heads Every 90 Days'),
      description: t(
        'toothbrush.infoCards.replaceInterval.description',
        'After ~3 months bristles splay and remove up to 40% less plaque. ADA and FDI therefore recommend replacing the brush (or head) every 90 days or sooner if bristles fray.'
      ),
      icon: 'time-outline',
      color: '#F39C12',
    },
    {
      id: 'fluoride_timing',
      title: t('toothbrush.infoCards.fluorideTiming.title', "Don't Rinse Fluoride Away"),
      description: t(
        'toothbrush.infoCards.fluorideTiming.description',
        "Spit—don't rinse—after brushing. Leaving a thin film of 1450 ppm fluoride on enamel can lower caries risk by ~25% (Public Health England guideline 2017)."
      ),
      icon: 'water-outline',
      color: '#00B894',
    },
    {
      id: 'pressure',
      title: t('toothbrush.infoCards.pressure.title', 'Easy on the Pressure'),
      description: t(
        'toothbrush.infoCards.pressure.description',
        'Pressing harder ≠ cleaner. >150 g of force can cause gum recession; plaque removal plateaus around 100 g. Let the bristles do the work.'
      ),
      icon: 'speedometer-outline',
      color: '#E74C3C',
    },
    {
      id: 'tongue_clean',
      title: t('toothbrush.infoCards.tongueClean.title', 'Remember Your Tongue'),
      description: t(
        'toothbrush.infoCards.tongueClean.description',
        "60–90 % of bad-breath compounds come from the tongue's dorsum. A quick 10-second tongue sweep can cut volatile sulfur compounds by half."
      ),
      icon: 'happy-outline',
      color: '#9B59B6',
    },
  ];

  const toggleInfoCard = (id: string) => {
    setExpandedInfo(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      return newSet;
    });
  };

  const renderInfoCard = (card: any) => {
    const isOpen = expandedInfo.has(card.id);
    return (
      <Pressable key={card.id} onPress={() => toggleInfoCard(card.id)} style={[styles.infoCard, { borderLeftColor: card.color }]}>
        <View style={styles.infoCardHeader}>
          <Ionicons name={card.icon as any} size={20} color={card.color} style={styles.infoCardIcon} />
          <ThemedText style={[styles.infoCardTitle, { color: card.color, flex:1 }]}>
            {card.title}
          </ThemedText>
          <Ionicons name={isOpen ? 'chevron-down' : 'chevron-forward'} size={20} color={'white'} />
        </View>
        {isOpen && (
          <ThemedText style={styles.infoCardDescription}>
            {card.description}
          </ThemedText>
        )}
      </Pressable>
    );
  };

  const renderHistoryItem = (brush: Toothbrush, index: number) => {
    const startDate = new Date(brush.startDate);
    const endDate = brush.endDate ? new Date(brush.endDate) : new Date();
    const usageDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const fallbackName = `${t(`toothbrush.type.${brush.type}`, brush.type === 'electric' ? 'Electric' : 'Manual')} Toothbrush`;
    const brushingCount = usageDays * 2; // assuming 2 brushings per day
    const reminderLike: ReminderTime = {
      id: brush.id,
      time: `${usageDays}d`,
      label: brush.name || fallbackName,
      enabled: false,
    };

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
          Used for {usageDays} day{usageDays !== 1 ? 's' : ''}
        </ThemedText>
        <ThemedText style={styles.historyItemDate}>
          {startDate.toLocaleDateString()} - {brush.endDate ? endDate.toLocaleDateString() : 'Current'}
        </ThemedText>
      </View>
    );
  };

  const modalData = [{ id: 'content' }];

  const renderContent = () => (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {renderCurrentBrush()}
        
        <View style={styles.actionsContainer}>
          {/* Replace Toothbrush Button - AddReminderButton Style */}
          <Pressable onPress={handleAddToothbrushPress} style={buttonStyles.addReminderItem}>
            <View style={buttonStyles.addReminderContent}>
              <View style={buttonStyles.addReminderTextContainer}>
                <ThemedText style={[buttonStyles.addReminderText, { color: activeColors.text }]}>
                  {t('toothbrush.newBrush.addNew', 'Add New Toothbrush')}
                </ThemedText>
              </View>
              <View style={buttonStyles.addReminderToggle}>
                <Animated.View style={plusAnimatedStyle}>
                  <Ionicons name="add" size={28} color="white" style={{ fontWeight: '900' }} />
                </Animated.View>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Inline Toothbrush Picker - appears below the button when adding */}
        <InlineToothbrushPicker
          visible={showToothbrushPicker}
          config={toothbrushConfig}
          onConfigChange={setToothbrushConfig}
          onSave={handleSaveToothbrush}
          onCancel={handleCancelToothbrushAdd}
          pickerOpacity={pickerOpacity}
          pickerScale={pickerScale}
        />
        
        {/* History Section using modular ReminderItem */}
        {toothbrushData.history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {t('toothbrush.history.title', 'Toothbrush History')}
              </ThemedText>
            </View>
            <View style={styles.historyContainer}>
              {toothbrushData.history.map((brush) => {
                const startDate = new Date(brush.startDate);
                const endDate = brush.endDate ? new Date(brush.endDate) : new Date();
                const usageDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

                const fallbackName = `${t(`toothbrush.type.${brush.type}`, brush.type === 'electric' ? 'Electric' : 'Manual')} Toothbrush`;
                const brushingCount = usageDays * 2;
                const reminderLike: ReminderTime = {
                  id: brush.id,
                  time: `${usageDays}d`,
                  label: brush.name || fallbackName,
                  enabled: false,
                };

                return (
                  <ReminderItem
                    ref={(ref)=>{historyItemRefs.current[brush.id]=ref;}}
                    key={brush.id}
                    reminder={reminderLike}
                    showToggle={false}
                    rightTop={t(`toothbrush.category.${brush.category}`, brush.category)}
                    rightBottom={`${brushingCount} ${brushingCount === 1 ? 'brushing' : 'brushings'}`}
                    onToggle={() => {}}
                    // editing disabled
                    onDelete={async (id) => {
                      const updatedHist = toothbrushData.history.filter(b => b.id !== id);
                      const newData = { ...toothbrushData, history: updatedHist };
                      setToothbrushData(newData);
                      await saveToothbrushData(newData);
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

        {/* Info Cards Section */}
        <View style={[styles.section, styles.tipsSection]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>
              {t('toothbrush.infoCards.title', 'Toothbrush Tips')}
            </ThemedText>
          </View>
          <View style={styles.infoCardsContainer}>
            {INFO_CARDS.map(renderInfoCard)}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const openPickerForBrush = (brush: Toothbrush, usageDays: number) => {
    // Close swipe row if open
    historyItemRefs.current[brush.id]?.closeSwipe();

    setToothbrushConfig({
      type: brush.type,
      category: brush.category,
      name: brush.name || '',
      brand: brush.brand || '',
      model: brush.model || '',
      isUsed: true,
      ageDays: usageDays,
    });

    // Rotate plus to X and show picker
    plusRotation.value = withTiming(45, { duration: 200 });
    setShowToothbrushPicker(true);
  };

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('toothbrush.title', 'Toothbrush Menu')}
      data={modalData}
      renderItem={renderContent}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    width: screenWidth * 0.85,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  // Toothbrush Card Styles (like nubo tone cards)
  toothbrushCard: {
    width: screenWidth * 0.85,
    minHeight: 130,
    borderRadius: 20,
    borderWidth: 1,
    paddingRight: 10,
    paddingLeft: 0,
    paddingTop: 10,
    paddingBottom: 0,
    marginVertical: 10,
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
  },

  toothbrushImage: {
    width: 120,
    height: 120,
    alignSelf: 'flex-end',
    transform: [{ scaleX: -1 }],
  },
  toothbrushCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toothbrushIconContainer: {
    marginRight: 0,
    marginLeft: -12,
  },
  toothbrushTextContainer: {
    flex: 1,
  },
  toothbrushCardTitle: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'Quicksand-Bold',
    color: 'white',
    flexShrink: 1,
    flexGrow: 1,
  },
  toothbrushCardSubtitle: {
    fontSize: 14,
    marginBottom: 4,
    opacity: 0.8,
    color: 'white',
  },
  toothbrushCardAge: {
    fontSize: 14,
    marginBottom: 4,
    color: 'white',
  },
  toothbrushCardHistory: {
    fontSize: 12,
    opacity: 0.7,
    color: 'white',
    alignSelf: 'flex-start',
  },
  toothbrushCardHistoryRight: {
    fontSize: 12,
    opacity: 0.7,
    color: 'white',
    marginLeft: 'auto',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noBrushContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBrushTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  noBrushText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  noBrushSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  currentBrushContainer: {
    paddingVertical: 16,
  },
  currentBrushHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  currentBrushInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentBrushText: {
    marginLeft: 12,
    flex: 1,
  },
  currentBrushType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentBrushAge: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  historyText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },

  actionsContainer: {
    marginTop: -14,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: 'rgba(0, 100, 255, 0.8)',
  },
  // secondaryButton styles removed
  // New sections
  section: {
    marginTop: 4,
  },
  tipsSection: {
    marginTop: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Quicksand-Bold',
    color: 'white',
  },
  historyContainer: {},
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
    flex: 1,
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
  infoCardsContainer: {
    gap: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoCardIcon: {
    marginRight: 8,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
}); 