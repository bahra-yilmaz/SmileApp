import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../constants/Colors';

interface MascotProgressBarProps {
  progress: number; // 0-100
  width?: DimensionValue;
}

const MascotProgressBar: React.FC<MascotProgressBarProps> = ({ progress, width = '100%' }) => {
  return (
    <View style={[styles.progressCard, { width }]}>
      <BlurView intensity={70} tint="light" style={styles.cardBlur}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  progressCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  cardBlur: {
    padding: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    width: '100%',
    backgroundColor: 'rgba(200, 200, 220, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
  },
});

export default MascotProgressBar; 