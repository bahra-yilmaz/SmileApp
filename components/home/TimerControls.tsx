import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';

interface TimerControlsProps {
  isRunning: boolean;
  onStartPress: () => void;
  onBrushedPress: () => void;
}

export default function TimerControls({
  isRunning,
  onStartPress,
  onBrushedPress,
}: TimerControlsProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.buttonsContainer}>
      <View style={styles.shadowContainer}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onStartPress();
          }}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { transform: [{ scale: 0.95 }] }
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.buttonIconContainer}>
              <MaterialCommunityIcons 
                name={isRunning ? "refresh" : "play"} 
                size={28} 
                color={Colors.primary[500]} 
              />
            </View>
            <ThemedText style={[styles.buttonText, { color: Colors.primary[500] }]}>
              {isRunning ? t('timerOverlay.restart') : t('timerOverlay.start')}
            </ThemedText>
          </View>
        </Pressable>
      </View>
      
      <View style={[styles.shadowContainer, { marginLeft: BUTTON_SPACING }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onBrushedPress();
          }}
          style={({ pressed }) => [
            styles.primaryColorButton,
            pressed && { transform: [{ scale: 0.95 }] }
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={styles.buttonIconContainer}>
              <MaterialCommunityIcons 
                name={isRunning ? "check" : "plus"} 
                size={28} 
                color="white" 
              />
            </View>
            <ThemedText style={[styles.buttonText, { color: 'white' }]}>
              {isRunning ? t('timerOverlay.done') : t('timerOverlay.brushed')}
            </ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const BUTTON_WIDTH = 140;
const BUTTON_HEIGHT = 52;
const BUTTON_SPACING = 12;

const styles = StyleSheet.create({
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 30,
  },
  primaryButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  primaryColorButton: {
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    borderRadius: 30,
    backgroundColor: Colors.primary[500],
    borderWidth: 1,
    borderColor: Colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIconContainer: {
    marginRight: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 2,
    fontFamily: 'Quicksand-Bold',
  },
}); 