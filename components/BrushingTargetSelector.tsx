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
  BrushingTimeOption, 
  TIME_TARGET_OPTIONS 
} from '../services/BrushingGoalsService';

const { width: screenWidth } = Dimensions.get('window');

// Use the centralized option type
export interface BrushingTarget extends BrushingTimeOption {}

interface BrushingTargetSelectorProps {
  visible: boolean;
  onClose: () => void;
  onUpdate?: (target: BrushingTarget) => void;
  autoClose?: boolean;
  selectedId?: string;
}

export default function BrushingTargetSelector({ 
  visible, 
  onClose, 
  onUpdate,
  autoClose = false,
  selectedId
}: BrushingTargetSelectorProps) {
  const { theme } = useTheme();
  const { activeColors } = theme;
  const { t } = useTranslation();
  const [currentTarget, setCurrentTarget] = useState<BrushingTarget | null>(null);

  // Use centralized target options with translations
  const TARGET_OPTIONS: BrushingTarget[] = TIME_TARGET_OPTIONS.map(option => ({
    ...option,
    label: t(option.label, option.label), // Apply translation
    description: t(option.description, option.description)
  }));

  useEffect(() => {
    if (visible) {
      if (selectedId) {
        const match = TARGET_OPTIONS.find(opt => opt.id === selectedId);
        if (match) setCurrentTarget(match);
      } else {
        loadCurrentTarget();
      }
    }
  }, [visible, selectedId, t]); // Add t as dependency

  const loadCurrentTarget = async () => {
    try {
      const goals = await BrushingGoalsService.getCurrentGoals();
      const timeOption = BrushingGoalsService.getTimeTargetOption(goals.timeTargetMinutes);
      
      if (timeOption) {
        const targetWithTranslations = {
          ...timeOption,
          label: t(timeOption.label, timeOption.label),
          description: t(timeOption.description, timeOption.description)
        };
        setCurrentTarget(targetWithTranslations);
      } else {
        // Fallback to standard if no match
        const standardOption = TARGET_OPTIONS.find(opt => opt.id === 'standard');
        if (standardOption) setCurrentTarget(standardOption);
      }
    } catch (error) {
      console.error('Error loading brushing target:', error);
      // Fallback to standard (2 minutes)
      const standardOption = TARGET_OPTIONS.find(opt => opt.id === 'standard');
      if (standardOption) setCurrentTarget(standardOption);
    }
  };

  const handleTargetSelect = async (target: BrushingTarget) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Update via centralized service
      await BrushingGoalsService.updateTimeTarget(target.minutes, {
        source: 'user'
      });
      
      setCurrentTarget(target);
      
      // Call the update callback if provided
      if (onUpdate) {
        onUpdate(target);
      }
      
      // Auto-close if configured
      if (autoClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error changing brushing target:', error);
      Alert.alert(
        t('settings.brushingTarget.error.title', 'Target Error'),
        t('settings.brushingTarget.error.message', 'Failed to change brushing target. Please try again.')
      );
    }
  };

  const renderTargetItem = ({ item: target }: { item: BrushingTarget }) => (
    <Pressable
      key={target.id}
      onPress={() => handleTargetSelect(target)}
      style={[
        styles.targetCard,
        { 
          borderColor: currentTarget?.id === target.id 
            ? activeColors.tint 
            : 'rgba(255, 255, 255, 0.3)',
          backgroundColor: currentTarget?.id === target.id 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.05)'
        }
      ]}
    >
      <View style={styles.targetCardContent}>
        <Ionicons 
          name={target.icon as any} 
          size={32} 
          color={currentTarget?.id === target.id ? activeColors.tint : 'white'} 
          style={styles.targetIcon}
        />
        <View style={styles.targetTextContainer}>
          <ThemedText style={[
            styles.targetCardTitle,
            {
              color: currentTarget?.id === target.id ? activeColors.tint : 'white'
            }
          ]}>
            {target.label}
          </ThemedText>
          <ThemedText style={[
            styles.targetCardDescription,
            {
              color: currentTarget?.id === target.id ? activeColors.tint : 'white',
              opacity: currentTarget?.id === target.id ? 1 : 0.9
            }
          ]}>
            {target.description}
          </ThemedText>
        </View>
        {currentTarget?.id === target.id && (
          <Ionicons name="checkmark-circle" size={24} color={activeColors.tint} />
        )}
      </View>
    </Pressable>
  );

  return (
    <BottomSheetModal
      visible={visible}
      onClose={onClose}
      title={t('settings.brushingTarget.selectTitle', 'Choose Your Target')}
      data={TARGET_OPTIONS}
      renderItem={renderTargetItem}
      keyExtractor={(item) => item.id}
    />
  );
}

const styles = StyleSheet.create({
  targetCard: {
    width: screenWidth * 0.85,
    minHeight: 80,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  targetCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  targetIcon: {
    marginRight: 16,
  },
  targetTextContainer: {
    flex: 1,
  },
  targetCardTitle: {
    fontSize: 18,
    marginBottom: 4,
    fontFamily: 'Quicksand-Bold',
  },
  targetCardDescription: {
    fontSize: 14,
  },
}); 