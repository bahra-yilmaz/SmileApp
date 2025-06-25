import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import InlineToothbrushPicker from './InlineToothbrushPicker';
import { ToothbrushService, ToothbrushDataService, Toothbrush } from '../services/toothbrush';
import { useToothbrushStats } from '../hooks/useToothbrushStats';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from './ui/PrimaryButton';

// This is the shape expected by the InlineToothbrushPicker
interface ToothbrushConfig {
    type: 'manual' | 'electric';
    category: 'regular' | 'braces' | 'sensitive' | 'whitening';
    name: string;
    brand: string;
    model: string;
    isUsed: boolean;
    ageDays: number;
}

interface ToothbrushManagerProps {
  visible: boolean;
  onClose: () => void;
  autoClose?: boolean;
}

export default function ToothbrushManager({
  visible,
  onClose,
  autoClose = false,
}: ToothbrushManagerProps) {
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { t } = useTranslation();
  const { user } = useAuth();
  const { stats, displayData, isLoading, refreshStats } = useToothbrushStats();
  
  const [currentBrush, setCurrentBrush] = useState<Toothbrush | null>(null);
  const [history, setHistory] = useState<Toothbrush[]>([]);
  const [showToothbrushPicker, setShowToothbrushPicker] = useState(false);
  const [toothbrushConfig, setToothbrushConfig] = useState<ToothbrushConfig>({
    type: 'manual',
    category: 'regular',
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

  const fetchData = async () => {
    const data = await ToothbrushDataService.getToothbrushData();
    setHistory(data.history || []);
    setCurrentBrush(data.current || null);
  };

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible]);

  const handleAddToothbrushPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

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
      
      // The service expects a different shape than the picker config
      const detailsForService = {
        type: toothbrushConfig.type,
        purpose: toothbrushConfig.category, // Map category to purpose
        brand: toothbrushConfig.brand,
        model: toothbrushConfig.model,
      };

      await ToothbrushService.replaceToothbrush(userId, detailsForService);
      
      // Refresh all data
      await refreshStats();
      await fetchData();

      handleCancelToothbrushAdd();
      if (autoClose) {
        onClose();
      }

    } catch (error) {
      console.error('Error saving toothbrush data:', error);
      Alert.alert(
        t('toothbrush.error.title', 'Error'),
        t('toothbrush.error.message', 'Failed to save toothbrush data. Please try again.')
      );
    }
  };

  const renderCurrentBrush = () => {
    if (isLoading) {
      return <View style={styles.currentBrushContainer} />;
    }
    
    if (!stats || !displayData || !currentBrush) {
      return (
        <View style={styles.noBrushContainer}>
          <ThemedText style={styles.noBrushText}>
            {t('toothbrush.manager.noCurrentBrush', 'No active toothbrush.')}
          </ThemedText>
        </View>
      );
    }

    const { healthColor, healthStatusText, healthPercentage, daysInUse } = displayData;
    const brandAndModel = currentBrush.brand && currentBrush.model 
      ? `${currentBrush.brand} ${currentBrush.model}` 
      : t('toothbrush.manager.defaultName', 'My Toothbrush');

    return (
      <View style={[
        styles.currentBrushContainer, 
        { backgroundColor: activeColors.card }
      ]}>
        <View style={styles.currentBrushHeader}>
          <ExpoImage 
            source={require('../assets/images/toothbrush.png')} 
            style={styles.currentBrushImage}
          />
          <View style={styles.currentBrushInfo}>
            <ThemedText style={styles.currentBrushTitle}>
              {brandAndModel}
            </ThemedText>
            <ThemedText style={styles.currentBrushAge}>
              {t('toothbrush.manager.daysInUse_plural', { count: daysInUse })}
            </ThemedText>
          </View>
        </View>
        <View style={styles.currentBrushStats}>
          <View style={[styles.statusBadge, { backgroundColor: healthColor }]}>
            <ThemedText style={styles.statusText}>{healthStatusText}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{stats.totalBrushingSessions}</ThemedText>
            <ThemedText style={styles.statLabel}>{t('toothbrush.manager.brushings', 'Brushings')}</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statValue}>{healthPercentage}%</ThemedText>
            <ThemedText style={styles.statLabel}>{t('toothbrush.manager.health', 'Health')}</ThemedText>
          </View>
        </View>
      </View>
    );
  };
  
  const renderHistoryItem = (brush: Toothbrush, index: number) => {
    const brushId = brush.id || `${brush.brand}-${brush.model}-${index}`;
    const brandAndModel = brush.brand && brush.model ? `${brush.brand} ${brush.model}` : t('toothbrush.manager.defaultName', 'My Toothbrush');
    return (
      <View key={brushId} style={[
        styles.historyItemContainer,
        { backgroundColor: activeColors.background }
      ]}>
        <View style={styles.historyItemHeader}>
          <ThemedText style={styles.historyItemTitle}>
            {brandAndModel}
          </ThemedText>
          <ThemedText style={styles.historyItemDate}>
             {new Date(brush.startDate).toLocaleDateString()}
          </ThemedText>
        </View>
      </View>
    );
  };
  
  const renderContent = () => (
    <ScrollView style={styles.container}>
      <ThemedText style={styles.title}>{t('toothbrush.manager.title', 'My Toothbrushes')}</ThemedText>
      
      {renderCurrentBrush()}
      
      <PrimaryButton
        onPress={handleAddToothbrushPress}
        label={showToothbrushPicker ? t('common.cancel') : t('toothbrush.manager.replaceButton', 'Replace Toothbrush')}
        style={{ marginTop: 20 }}
      />
      
      {showToothbrushPicker && (
        <Animated.View style={[
          styles.pickerContainer, 
          { opacity: pickerOpacity, transform: [{ scale: pickerScale }] }
        ]}>
          <InlineToothbrushPicker
            visible={showToothbrushPicker}
            config={toothbrushConfig}
            onConfigChange={setToothbrushConfig}
            onSave={handleSaveToothbrush}
            onCancel={handleCancelToothbrushAdd}
            pickerOpacity={pickerOpacity}
            pickerScale={pickerScale}
          />
        </Animated.View>
      )}

      {history && history.length > 0 && (
        <View style={styles.historySection}>
          <ThemedText style={styles.historyTitle}>{t('toothbrush.manager.historyTitle', 'History')}</ThemedText>
          {history.map((brush, index) => renderHistoryItem(brush, index))}
        </View>
      )}
    </ScrollView>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('toothbrush.manager.title')}
      data={[{ id: 'main-content' }]}
      renderItem={renderContent}
      keyExtractor={item => item.id}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Merienda-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  currentBrushContainer: {
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentBrushHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentBrushImage: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  currentBrushInfo: {
    flex: 1,
  },
  currentBrushTitle: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  currentBrushAge: {
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    opacity: 0.7,
  },
  currentBrushStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand-Regular',
    opacity: 0.6,
  },
  statusBadge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    position: 'absolute',
    top: -8,
    right: 0,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Quicksand-Bold',
  },
  pickerContainer: {
    marginTop: 15,
  },
  historySection: {
    marginTop: 30,
  },
  historyTitle: {
    fontSize: 20,
    fontFamily: 'Merienda-Bold',
    marginBottom: 10,
  },
  historyItemContainer: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyItemTitle: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
  },
    historyItemDate: {
    fontSize: 14,
    fontFamily: 'Quicksand-Regular',
    opacity: 0.7,
  },
  noBrushContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  noBrushText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.7
  }
}); 