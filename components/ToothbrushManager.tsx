import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Alert, ScrollView } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { cardStyles, buttonStyles, getSecondaryCardStyle } from '../utils/sharedStyles';
import InlineToothbrushPicker from './InlineToothbrushPicker';
import ReminderItem, { ReminderTime, ReminderItemRef } from './ReminderItem';
import { useAuth } from '../context/AuthContext';
import { useToothbrushStats } from '../hooks/useToothbrushStats';
import { ToothbrushService } from '../services/toothbrush';
import type { Toothbrush, ToothbrushData } from '../services/toothbrush/ToothbrushTypes';
import { getTodayLocalString } from '../utils/dateUtils';

const { width: screenWidth } = Dimensions.get('window');

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
  const { user } = useAuth();
  const { stats, displayData, currentToothbrush, isLoading, refreshStats } = useToothbrushStats();
  
  const [history, setHistory] = useState<Toothbrush[]>([]);
  const [historyCounts, setHistoryCounts] = useState<Record<string, number>>({});
  const [tagWidth, setTagWidth] = useState(0);

  const glassStyle = getSecondaryCardStyle(theme);

  // Expandable menu state
  const [showToothbrushPicker, setShowToothbrushPicker] = useState(false);
  const [toothbrushConfig, setToothbrushConfig] = useState({
    type: 'manual' as 'manual' | 'electric',
    category: 'regular' as 'regular' | 'braces' | 'sensitive' | 'whitening',
    name: '',
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

  const [expandedInfo, setExpandedInfo] = useState<Set<string>>(new Set());
  const historyItemRefs = useRef<{ [key: string]: ReminderItemRef | null }>({});

  const fetchData = async () => {
    try {
      const userId = user?.id || 'guest';
      const data = await ToothbrushService.getAllToothbrushData(userId);
      setHistory(data.history);
      if (onUpdate) {
        onUpdate(data);
      }
      if (user && user.id && user.id !== 'guest') {
        await fetchCountsForHistory(data.history, user.id);
      }
    } catch (error) {
      console.error('Error loading toothbrush data:', error);
    }
  };

  const fetchCountsForHistory = useCallback(async (hist: Toothbrush[], userId: string) => {
    const counts: Record<string, number> = {};
    for (const brush of hist) {
      const count = await ToothbrushService.getBrushingCount(userId, brush.id);
      counts[brush.id] = count;
    }
    setHistoryCounts(counts);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);

  const getAgeDisplayText = () => {
    if (isLoading && !displayData) return t('common.loading', '...');
    if (!displayData) return '';
    
    const { daysInUse } = displayData;
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
  
  const handleAddToothbrushPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (showToothbrushPicker) {
      handleCancelToothbrushAdd();
      return;
    }
    
    setToothbrushConfig({
      type: 'manual', category: 'regular', name: '', isUsed: false, ageDays: 0,
    });
    
    setShowToothbrushPicker(true);
    pickerOpacity.value = withTiming(1, { duration: 300 });
    pickerScale.value = withTiming(1, { duration: 300 });
    plusRotation.value = withTiming(45, { duration: 200 });
  };

  const handleCancelToothbrushAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickerOpacity.value = withTiming(0, { duration: 200 });
    pickerScale.value = withTiming(0.95, { duration: 250 });
    plusRotation.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setShowToothbrushPicker(false);
    }, 250);
  };

  const handleSaveToothbrush = async () => {
    try {
      const userId = user?.id || 'guest';
      
      // Check if user is guest
      if (userId === 'guest') {
        Alert.alert(
          t('toothbrush.error.title'),
          t('toothbrush.guestMode'),
          [{ text: t('common.ok'), style: 'default' }]
        );
        return;
      }
      
      console.log('🦷 Saving toothbrush for user:', userId);
      
      await ToothbrushService.replaceToothbrush(userId, {
        type: toothbrushConfig.type,
        purpose: toothbrushConfig.category,
        name: toothbrushConfig.name || undefined, // Include name if provided
        ageDays: toothbrushConfig.isUsed ? toothbrushConfig.ageDays : 0,
      });

      console.log('✅ Toothbrush saved successfully, refreshing data...');

      // Refresh data - ensure both sources are updated
      await Promise.all([
        refreshStats(), // Refresh hook data
        fetchData()     // Refresh local data
      ]);
      
      console.log('✅ Data refreshed successfully');
      
      handleCancelToothbrushAdd(); // Close and reset picker
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (autoClose) {
        onClose();
      }
    } catch (error) {
      console.error('❌ Error creating new toothbrush:', error);
       Alert.alert(
        t('toothbrush.error.title', 'Error'),
        t('toothbrush.error.message', 'Failed to save toothbrush data. Please try again.')
      );
    }
  };

  const renderCurrentToothbrushCard = () => {
    if (isLoading && !currentToothbrush) {
      return (
        <View style={[styles.currentBrushCard, glassStyle]}>
          <ThemedText>{t('common.loading', '...')}</ThemedText>
        </View>
      );
    }

    if (!currentToothbrush) {
      return (
        <View style={[styles.currentBrushCard, glassStyle]}>
          <ThemedText style={styles.noBrushText}>
            {t('toothbrush.status.addToothbrush', 'Add your toothbrush')}
          </ThemedText>
          <ThemedText style={styles.noBrushSubtext}>
            {t('toothbrush.guestMode')}
          </ThemedText>
        </View>
      );
    }

    return (
      <View style={[styles.currentBrushCard, glassStyle]}>
        {/* Status badge positioned at top right, with onLayout to measure its width */}
        {displayData && (
          <View
            style={[styles.statusBadge, { backgroundColor: displayData.healthColor }]}
            onLayout={(event) => setTagWidth(event.nativeEvent.layout.width)}
          >
            <ThemedText style={styles.statusText}>{displayData.healthStatusText}</ThemedText>
          </View>
        )}

        <View style={styles.cardHeader}>
          <ExpoImage
            source={require('../assets/images/toothbrush.png')}
            style={styles.brushIcon}
            contentFit="contain"
          />
          <View style={[styles.brushInfo, { paddingRight: tagWidth > 0 ? tagWidth + 24 : 12 }]}>
            <ThemedText variant="subtitle" style={styles.brushName} numberOfLines={2}>
              {currentToothbrush.name || t('toothbrush.item', 'Toothbrush')}
            </ThemedText>
            {/* Purpose text now above the age/brushing row */}
            <ThemedText style={styles.brushPurpose}>
              {t(`toothbrush.category.${currentToothbrush.purpose ?? 'regular'}`)}
            </ThemedText>
            {/* New row for age and brushing count */}
            <View style={styles.ageRow}>
              <ThemedText style={styles.brushAge}>{getAgeDisplayText()}</ThemedText>
            </View>
          </View>
        </View>

        {/* Brushing count positioned at bottom right of card */}
        {stats && (
          <ThemedText style={styles.brushingCount}>
            {t('toothbrush.history.brushings_other', { count: stats.totalBrushingSessions })}
          </ThemedText>
        )}
      </View>
    );
  };

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

  const renderContent = () => (
    <ScrollView
      style={styles.scrollContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {renderCurrentToothbrushCard()}
        
        <View style={styles.actionsContainer}>
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

        <InlineToothbrushPicker
          visible={showToothbrushPicker}
          config={toothbrushConfig}
          onConfigChange={setToothbrushConfig}
          onSave={handleSaveToothbrush}
          onCancel={handleCancelToothbrushAdd}
          pickerOpacity={pickerOpacity}
          pickerScale={pickerScale}
        />
        
        {history.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                {t('toothbrush.history.title', 'Toothbrush History')}
              </ThemedText>
            </View>
            <View style={styles.historyContainer}>
              {history.map((brush) => {
                const startDate = new Date(brush.startDate);
                const endDate = brush.endDate ? new Date(brush.endDate) : new Date();
                const usageDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                const brushingCount = historyCounts[brush.id] ?? 0;

                const fallbackName = `${t(`toothbrush.type.${brush.type}`)} ${t('toothbrush.item')}`;
                const purposeKey = brush.purpose ?? 'regular';
                
                const reminderLike: ReminderTime = {
                  id: brush.id,
                  time: t('toothbrush.history.ageDays', { count: usageDays }),
                  label: brush.name || fallbackName,
                  enabled: false,
                };

                return (
                  <ReminderItem
                    ref={(ref)=>{historyItemRefs.current[brush.id]=ref;}}
                    key={brush.id}
                    reminder={reminderLike}
                    showToggle={false}
                    rightTop={t(`toothbrush.category.${purposeKey}`)}
                    rightBottom={t('toothbrush.history.brushings', { count: brushingCount })}
                    onToggle={() => {}}
                    onDelete={async (id) => {
                      const userId = user?.id || 'guest';
                      await ToothbrushService.deleteFromHistory(userId, id);
                      fetchData(); // Re-fetch data to update UI
                    }}
                  />
                );
              })}
            </View>
          </View>
        )}

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

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('toothbrush.title', 'Toothbrush Menu')}
      data={[{ id: 'content' }]}
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
    ...cardStyles.baseCard,
    width: screenWidth * 0.85,
    minHeight: 130,
    paddingRight: 10,
    paddingLeft: 0,
    paddingTop: 10,
    paddingBottom: 0,
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
    alignItems: 'baseline',
    width: '100%',
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
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
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
  currentBrushCard: {
    ...cardStyles.baseCard,
    width: screenWidth * 0.85,
    minHeight: 130,
    paddingRight: 10,
    paddingLeft: 0,
    paddingTop: 10,
    paddingBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brushIcon: {
    width: 120,
    height: 120,
    alignSelf: 'flex-end',
    transform: [{ scaleX: -1 }],
  },
  brushInfo: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 8,
  },
  brushName: {
    fontSize: 18,
    lineHeight: 24,
    marginBottom: 4,
    fontFamily: 'Quicksand-Bold',
    color: 'white',
    flexShrink: 1,
    flexGrow: 1,
  },
  brushAge: {
    fontSize: 14,
    marginBottom: 10,
    color: 'white',
    opacity: 0.9,
  },
  brushPurpose: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  brushingCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  addButton: {
    ...buttonStyles.addReminderItem,
  },
  contentContainer: {
    width: screenWidth * 0.85,
    alignSelf: 'center',
    paddingVertical: 10,
  },
}); 