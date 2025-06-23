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
const BRUSHING_TARGET_KEY = 'brushing_target';

// Brushing target interface
export interface BrushingTarget {
  id: string;
  minutes: number;
  label: string;
  description: string;
  icon: string;
}

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

  // Brushing target options
  const TARGET_OPTIONS: BrushingTarget[] = [
    {
      id: 'quick',
      minutes: 90,
      label: t('settings.brushingTarget.options.quick_label', '1.5 minutes'),
      description: t('settings.brushingTarget.options.quick_description', 'Quick but effective'),
      icon: 'flash-outline'
    },
    {
      id: 'standard',
      minutes: 120,
      label: t('settings.brushingTarget.options.standard_label', '2 minutes'),
      description: t('settings.brushingTarget.options.standard_description', 'Dentist recommended'),
      icon: 'checkmark-circle-outline'
    },
    {
      id: 'thorough',
      minutes: 180,
      label: t('settings.brushingTarget.options.thorough_label', '3 minutes'),
      description: t('settings.brushingTarget.options.thorough_description', 'Extra thorough cleaning'),
      icon: 'star-outline'
    },
    {
      id: 'comprehensive',
      minutes: 240,
      label: t('settings.brushingTarget.options.comprehensive_label', '4 minutes'),
      description: t('settings.brushingTarget.options.comprehensive_description', 'Comprehensive care'),
      icon: 'diamond-outline'
    }
  ];

  useEffect(() => {
    if (visible) {
      if (selectedId) {
        const match = TARGET_OPTIONS.find(opt => opt.id === selectedId);
        if (match) setCurrentTarget(match);
      } else {
        loadCurrentTarget();
      }
    }
  }, [visible, selectedId]);

  const loadCurrentTarget = async () => {
    try {
      const storedTarget = await AsyncStorage.getItem(BRUSHING_TARGET_KEY);
      if (storedTarget) {
        const targetData = JSON.parse(storedTarget);
        const target = TARGET_OPTIONS.find(option => option.id === targetData.id);
        if (target) {
          setCurrentTarget(target);
        }
      } else {
        // fallback to minutes key
        const minutesStr = await AsyncStorage.getItem('brushing_time_goal');
        if (minutesStr) {
          const min = parseFloat(minutesStr);
          const target = TARGET_OPTIONS.find(opt => opt.minutes/60 === min);
          if (target) setCurrentTarget(target);
        }
      }
    } catch (error) {
      console.error('Error loading brushing target:', error);
      setCurrentTarget(TARGET_OPTIONS[1]); // Default to standard
    }
  };

  const handleTargetSelect = async (target: BrushingTarget) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const targetData = {
        id: target.id,
        minutes: target.minutes,
        label: target.label,
        description: target.description
      };
      await AsyncStorage.setItem(BRUSHING_TARGET_KEY, JSON.stringify(targetData));
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