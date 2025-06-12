import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from './ThemeProvider';
import ThemedText from './ThemedText';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface ToothbrushConfig {
  type: 'manual' | 'electric';
  category: 'regular' | 'braces' | 'sensitive' | 'whitening';
  /**
   * User friendly identifier for this toothbrush (e.g., "My Snow-White Brush").
   */
  name: string;
  brand: string;
  model: string;
}

interface InlineToothbrushPickerProps {
  visible: boolean;
  config: ToothbrushConfig;
  onConfigChange: (config: ToothbrushConfig) => void;
  onSave: () => void;
  onCancel: () => void;
  pickerOpacity: SharedValue<number>;
  pickerScale: SharedValue<number>;
}

export default function InlineToothbrushPicker({
  visible,
  config,
  onConfigChange,
  onSave,
  onCancel,
  pickerOpacity,
  pickerScale,
}: InlineToothbrushPickerProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { activeColors } = theme;

  const toothbrushTypes = [
    { id: 'manual', label: t('toothbrush.type.manual', 'Manual'), icon: 'brush' },
    { id: 'electric', label: t('toothbrush.type.electric', 'Electric'), icon: 'flash' },
  ];

  const toothbrushCategories = [
    { id: 'regular', label: t('toothbrush.category.regular', 'Regular'), icon: 'checkmark-circle' },
    { id: 'braces', label: t('toothbrush.category.braces', 'Braces'), icon: 'medical' },
    { id: 'sensitive', label: t('toothbrush.category.sensitive', 'Sensitive'), icon: 'heart' },
    { id: 'whitening', label: t('toothbrush.category.whitening', 'Whitening'), icon: 'star' },
  ];

  const handleTypeSelect = (type: 'manual' | 'electric') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfigChange({ ...config, type });
  };

  const handleCategorySelect = (category: 'regular' | 'braces' | 'sensitive' | 'whitening') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onConfigChange({ ...config, category });
  };

  const handleNameChange = (text: string) => {
    onConfigChange({ ...config, name: text });
  };

  const handleBrandChange = (brand: string) => {
    onConfigChange({ ...config, brand });
  };

  const handleModelChange = (model: string) => {
    onConfigChange({ ...config, model });
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSave();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCancel();
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: pickerOpacity,
          transform: [{ scale: pickerScale }],
        },
      ]}
    >
      {/* Separator Line - matching InlineTimePicker */}
      <View style={styles.pickerSeparator} />

      {/* Name Input */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Name</ThemedText>
        <TextInput
          style={styles.textInput}
          value={config.name}
          onChangeText={handleNameChange}
          placeholder={t('toothbrush.picker.namePlaceholder', 'e.g., Daily Driver')}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          maxLength={30}
        />
      </View>

      {/* Type Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          {t('toothbrush.picker.type', 'Type')}
        </ThemedText>
        <View style={styles.optionsContainer}>
          {toothbrushTypes.map((type) => (
            <Pressable
              key={type.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: config.type === type.id 
                    ? activeColors.tint 
                    : 'rgba(255, 255, 255, 0.15)',
                }
              ]}
              onPress={() => handleTypeSelect(type.id as 'manual' | 'electric')}
            >
              <Ionicons 
                name={type.icon as any} 
                size={20} 
                color={config.type === type.id ? 'white' : activeColors.text} 
              />
              <ThemedText style={[
                styles.optionText,
                { color: config.type === type.id ? 'white' : activeColors.text }
              ]}>
                {type.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Head Selection */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>
          {t('toothbrush.picker.head', 'Toothbrush Head')}
        </ThemedText>
        <View style={styles.categoryGrid}>
          {toothbrushCategories.map((category) => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: config.category === category.id 
                    ? activeColors.tint 
                    : 'rgba(255, 255, 255, 0.15)',
                }
              ]}
              onPress={() => handleCategorySelect(category.id as any)}
            >
              <Ionicons 
                name={category.icon as any} 
                size={18} 
                color={config.category === category.id ? 'white' : activeColors.text} 
              />
              <ThemedText style={[
                styles.categoryText,
                { color: config.category === category.id ? 'white' : activeColors.text }
              ]}>
                {category.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.inlineActionButtons}>
        <Pressable style={styles.cancelInlineButton} onPress={handleCancel}>
          <ThemedText style={styles.cancelInlineButtonText}>
            {t('common.cancel', 'Cancel')}
          </ThemedText>
        </Pressable>
        <Pressable style={[styles.saveTimeButton, { backgroundColor: theme.colors.primary[500] }]} onPress={handleSave}>
          <ThemedText style={styles.saveTimeButtonText}>
            {t('toothbrush.addToothbrush', 'Add Brush')}
          </ThemedText>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  pickerSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 15,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: 'white',
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    width: (screenWidth * 0.85 - 40 - 8) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 4,
  },
  inputsContainer: {
    /* deprecated after user removed details section */
    gap: 12,
  },
  inputContainer: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  inlineActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  cancelInlineButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelInlineButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  saveTimeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveTimeButtonText: {
    fontSize: 16,
    fontFamily: 'Quicksand-Medium',
    color: 'white',
  },
}); 