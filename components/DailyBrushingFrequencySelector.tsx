import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');
const DAILY_FREQUENCY_KEY = 'daily_brushing_frequency';

// Daily brushing frequency interface
export interface DailyBrushingFrequency {
  id: string;
  count: number;
  label: string;
  description: string;
  icon: string;
}

interface DailyBrushingFrequencySelectorProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (frequency: DailyBrushingFrequency) => void;
  autoClose?: boolean;
  selectedId?: string;
}

export default function DailyBrushingFrequencySelector({ 
  visible, 
  onClose, 
  onUpdate,
  autoClose = false,
  selectedId
}: DailyBrushingFrequencySelectorProps) {
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { t } = useTranslation();
  const [currentFrequency, setCurrentFrequency] = useState<DailyBrushingFrequency | null>(null);

  // Daily brushing frequency options
  const FREQUENCY_OPTIONS: DailyBrushingFrequency[] = [
    {
      id: 'minimal',
      count: 1,
      label: t('settings.dailyFrequency.options.minimal_label', '1 time per day'),
      description: t('settings.dailyFrequency.options.minimal_description', 'Basic maintenance'),
      icon: 'sunny-outline'
    },
    {
      id: 'standard',
      count: 2,
      label: t('settings.dailyFrequency.options.standard_label', '2 times per day'),
      description: t('settings.dailyFrequency.options.standard_description', 'Morning and evening'),
      icon: 'checkmark-circle-outline'
    },
    {
      id: 'recommended',
      count: 3,
      label: t('settings.dailyFrequency.options.recommended_label', '3 times per day'),
      description: t('settings.dailyFrequency.options.recommended_description', 'After each meal'),
      icon: 'star-outline'
    },
    {
      id: 'comprehensive',
      count: 4,
      label: t('settings.dailyFrequency.options.comprehensive_label', '4+ times per day'),
      description: t('settings.dailyFrequency.options.comprehensive_description', 'Maximum care'),
      icon: 'diamond-outline'
    }
  ];

  useEffect(() => {
    if (visible) {
      if (selectedId) {
        const match = FREQUENCY_OPTIONS.find(opt => opt.id === selectedId);
        if (match) setCurrentFrequency(match);
      } else {
        loadCurrentFrequency();
      }
    }
  }, [visible, selectedId]);

  const loadCurrentFrequency = async () => {
    try {
      const storedFrequency = await AsyncStorage.getItem(DAILY_FREQUENCY_KEY);
      if (storedFrequency) {
        const frequencyData = JSON.parse(storedFrequency);
        const frequency = FREQUENCY_OPTIONS.find(option => option.id === frequencyData.id);
        if (frequency) {
          setCurrentFrequency(frequency);
        }
      } else {
        // Default to standard (2 times per day) if no frequency is stored
        setCurrentFrequency(FREQUENCY_OPTIONS[1]);
      }
    } catch (error) {
      console.error('Error loading daily brushing frequency:', error);
      setCurrentFrequency(FREQUENCY_OPTIONS[1]); // Default to standard
    }
  };

  const handleFrequencySelect = async (frequency: DailyBrushingFrequency) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const frequencyData = {
        id: frequency.id,
        count: frequency.count,
        label: frequency.label,
        description: frequency.description
      };
      await AsyncStorage.setItem(DAILY_FREQUENCY_KEY, JSON.stringify(frequencyData));
      setCurrentFrequency(frequency);
      
      // Call the update callback if provided
      if (onUpdate) {
        onUpdate(frequency);
      }
      
      // Auto-close if configured
      if (autoClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error changing daily brushing frequency:', error);
      Alert.alert(
        t('settings.dailyFrequency.error.title', 'Frequency Error'),
        t('settings.dailyFrequency.error.message', 'Failed to change daily brushing frequency. Please try again.')
      );
    }
  };

  const renderFrequencyItem = ({ item: frequency }: { item: DailyBrushingFrequency }) => (
    <Pressable
      key={frequency.id}
      onPress={() => handleFrequencySelect(frequency)}
      style={[
        styles.frequencyCard,
        { 
          borderColor: currentFrequency?.id === frequency.id 
            ? activeColors.tint 
            : 'rgba(255, 255, 255, 0.3)',
          backgroundColor: currentFrequency?.id === frequency.id 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)'
        }
      ]}
    >
      <View style={styles.frequencyCardContent}>
        <Ionicons 
          name={frequency.icon as any} 
          size={32} 
          color={currentFrequency?.id === frequency.id ? activeColors.tint : 'white'} 
          style={styles.frequencyIcon}
        />
        <View style={styles.frequencyTextContainer}>
          <ThemedText style={[
            styles.frequencyCardTitle,
            {
              color: currentFrequency?.id === frequency.id ? activeColors.tint : 'white'
            }
          ]}>
            {frequency.label}
          </ThemedText>
          <ThemedText style={[
            styles.frequencyCardDescription,
            {
              color: currentFrequency?.id === frequency.id ? activeColors.tint : 'white',
              opacity: currentFrequency?.id === frequency.id ? 1 : 0.9
            }
          ]}>
            {frequency.description}
          </ThemedText>
        </View>
        {currentFrequency?.id === frequency.id && (
          <Ionicons name="checkmark-circle" size={24} color={activeColors.tint} />
        )}
      </View>
    </Pressable>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('settings.dailyFrequency.selectTitle', 'Choose Daily Frequency')}
      data={FREQUENCY_OPTIONS}
      renderItem={renderFrequencyItem}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  frequencyCard: {
    width: screenWidth * 0.85,
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  frequencyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  frequencyIcon: {
    marginRight: 16,
  },
  frequencyTextContainer: {
    flex: 1,
  },
  frequencyCardTitle: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'Quicksand-Bold',
  },
  frequencyCardDescription: {
    fontSize: 14,
  },
}); 