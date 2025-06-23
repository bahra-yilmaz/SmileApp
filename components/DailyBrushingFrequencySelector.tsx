import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Alert } from 'react-native';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import BottomSheetModal from './ui/BottomSheetModal';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { 
  BrushingGoalsService, 
  BrushingFrequencyOption, 
  FREQUENCY_OPTIONS 
} from '../services/BrushingGoalsService';

const { width: screenWidth } = Dimensions.get('window');

// Use the centralized option type
export interface DailyBrushingFrequency extends BrushingFrequencyOption {}

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

  // Use centralized frequency options with translations
  const FREQUENCY_OPTIONS_TRANSLATED: DailyBrushingFrequency[] = FREQUENCY_OPTIONS.map(option => ({
    ...option,
    label: t(option.label, option.label), // Apply translation
    description: t(option.description, option.description)
  }));

  useEffect(() => {
    if (visible) {
      if (selectedId) {
        const match = FREQUENCY_OPTIONS_TRANSLATED.find(opt => opt.id === selectedId);
        if (match) setCurrentFrequency(match);
      } else {
        loadCurrentFrequency();
      }
    }
  }, [visible, selectedId, t]); // Add t as dependency

  const loadCurrentFrequency = async () => {
    try {
      const goals = await BrushingGoalsService.getCurrentGoals();
      const frequencyOption = BrushingGoalsService.getFrequencyOption(goals.dailyFrequency);
      
      if (frequencyOption) {
        const frequencyWithTranslations = {
          ...frequencyOption,
          label: t(frequencyOption.label, frequencyOption.label),
          description: t(frequencyOption.description, frequencyOption.description)
        };
        setCurrentFrequency(frequencyWithTranslations);
      } else {
        // Fallback to standard if no match
        const standardOption = FREQUENCY_OPTIONS_TRANSLATED.find(opt => opt.id === 'standard');
        if (standardOption) setCurrentFrequency(standardOption);
      }
    } catch (error) {
      console.error('Error loading daily brushing frequency:', error);
      // Fallback to standard (2 times per day)
      const standardOption = FREQUENCY_OPTIONS_TRANSLATED.find(opt => opt.id === 'standard');
      if (standardOption) setCurrentFrequency(standardOption);
    }
  };

  const handleFrequencySelect = async (frequency: DailyBrushingFrequency) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Update via centralized service
      await BrushingGoalsService.updateFrequency(frequency.count, {
        source: 'user'
      });
      
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
      data={FREQUENCY_OPTIONS_TRANSLATED}
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