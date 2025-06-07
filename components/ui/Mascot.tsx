import React from 'react';
import { Image, StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import type { MascotVariant } from '../../types/mascot';

interface MascotProps {
  /**
   * The variant of mascot to display
   */
  variant?: MascotVariant;
  
  /**
   * Optional style for the container
   */
  containerStyle?: ViewStyle;
  
  /**
   * Optional style for the image
   */
  imageStyle?: ImageStyle;
  
  /**
   * Size of the mascot
   */
  size?: number;
}

/**
 * Displays the Nubo mascot in different poses
 */
export default function Mascot({
  variant = 'nubo-welcoming-1',
  containerStyle,
  imageStyle,
  size = 100,
}: MascotProps) {
  const getImage = () => {
    switch (variant) {
      // --- Wise Category ---
      case 'nubo-wise-1':
        return require('../../assets/mascot/nubo-wise-1.png');
      case 'nubo-wise-2':
        return require('../../assets/mascot/nubo-wise-2.png');
      case 'nubo-wise-3':
        return require('../../assets/mascot/nubo-wise-3.png');
      case 'nubo-wise-4':
        return require('../../assets/mascot/nubo-wise-4.png');
      case 'nubo-wise-1-pp':
        return require('../../assets/mascot/nubo-wise-1-pp.png');
      case 'nubo-wise-2-pp':
        return require('../../assets/mascot/nubo-wise-2-pp.png');
      case 'nubo-wise-3-pp':
        return require('../../assets/mascot/nubo-wise-3-pp.png');

      // --- Welcoming Category ---
      case 'nubo-welcoming-1':
        return require('../../assets/mascot/nubo-welcoming-1.png');
      case 'nubo-welcoming-1-pp':
        return require('../../assets/mascot/nubo-welcoming-1-pp.png');
      case 'nubo-welcoming-2':
        return require('../../assets/mascot/nubo-welcoming-2.png');
      case 'nubo-welcoming-wave':
        return require('../../assets/mascot/nubo-waving-1.png');

      // --- Cool Category ---
      case 'nubo-cool-1':
        return require('../../assets/mascot/nubo-cool-1.png');
      case 'nubo-cool-2':
        return require('../../assets/mascot/nubo-cool-2.png');
      case 'nubo-cool-3':
        return require('../../assets/mascot/nubo-cool-3.png');
      case 'nubo-cool-4':
        return require('../../assets/mascot/nubo-cool-4.png');
      case 'nubo-cool-5':
        return require('../../assets/mascot/nubo-cool-5.png');
      case 'nubo-cool-1-pp':
        return require('../../assets/mascot/nubo-cool-1-pp.png');
      case 'nubo-cool-2-pp':
        return require('../../assets/mascot/nubo-cool-2-pp.png');
      case 'nubo-cool-3-pp':
        return require('../../assets/mascot/nubo-cool-3-pp.png');

      // --- Playful Category ---
      case 'nubo-playful-1':
        return require('../../assets/mascot/nubo-playful-1.png');
      case 'nubo-playful-2':
        return require('../../assets/mascot/nubo-playful-2.png');
      case 'nubo-playful-3':
        return require('../../assets/mascot/nubo-playful-3.png');
      case 'nubo-playful-4':
        return require('../../assets/mascot/nubo-playful-4.png');
      case 'nubo-playful-5':
        return require('../../assets/mascot/nubo-playful-5.png');
      case 'nubo-playful-1-pp':
        return require('../../assets/mascot/nubo-playful-1-pp.png');
      case 'nubo-playful-2-pp':
        return require('../../assets/mascot/nubo-playful-2-pp.png');
      case 'nubo-playful-3-pp':
        return require('../../assets/mascot/nubo-playful-3-pp.png');
      case 'nubo-playful-4-pp':
        return require('../../assets/mascot/nubo-playful-4-pp.png');
        
      // --- Supportive Category ---
      case 'nubo-supportive-2':
        return require('../../assets/mascot/nubo-supportive-2.png');
      case 'nubo-supportive-3':
        return require('../../assets/mascot/nubo-supportive-3.png');
      case 'nubo-supportive-4':
        return require('../../assets/mascot/nubo-supportive-4.png');
      case 'nubo-supportive-5':
        return require('../../assets/mascot/nubo-supportive-5.png');
      case 'nubo-supportive-6':
        return require('../../assets/mascot/nubo-supportive-6.png');
      case 'nubo-supportive-1-pp':
        return require('../../assets/mascot/nubo-supportive-1-pp.png');
      case 'nubo-supportive-2-pp':
        return require('../../assets/mascot/nubo-supportive-2-pp.png');
      case 'nubo-supportive-3-pp':
        return require('../../assets/mascot/nubo-supportive-3-pp.png');
      case 'nubo-supportive-4-pp':
        return require('../../assets/mascot/nubo-supportive-4-pp.png');
        
      // --- Neutral Category ---
      case 'nubo-neutral-1':
        return require('../../assets/mascot/nubo-neutral-1.png');
      case 'nubo-neutral-2':
        return require('../../assets/mascot/nubo-neutral-2.png');
      case 'nubo-neutral-3':
        return require('../../assets/mascot/nubo-neutral-3.png');
      case 'nubo-neutral-4':
        return require('../../assets/mascot/nubo-neutral-4.png');
      case 'nubo-neutral-5':
        return require('../../assets/mascot/nubo-neutral-5.png');
      case 'nubo-neutral-6':
        return require('../../assets/mascot/nubo-neutral-6.png');
      case 'nubo-neutral-7':
        return require('../../assets/mascot/nubo-neutral-7.png');
      case 'nubo-neutral-1-pp':
        return require('../../assets/mascot/nubo-neutral-1-pp.png');
      case 'nubo-neutral-2-pp':
        return require('../../assets/mascot/nubo-neutral-2-pp.png');
      case 'nubo-neutral-3-pp':
        return require('../../assets/mascot/nubo-neutral-3-pp.png');
      case 'nubo-neutral-4-pp':
        return require('../../assets/mascot/nubo-neutral-4-pp.png');
      case 'nubo-neutral-5-pp':
        return require('../../assets/mascot/nubo-neutral-5-pp.png');
        
      // --- Daily Routine Category ---
      case 'nubo-daily-brush':
        return require('../../assets/mascot/nubo-brushing-1.png');
      case 'nubo-brushing-1-pp':
        return require('../../assets/mascot/nubo-brushing-1-pp.png');
      case 'nubo-daily-brush-2':
        return require('../../assets/mascot/nubo-brushing-2.png');

      default:
        console.warn(`Mascot variant "${variant}" not found or asset missing, using default 'nubo-welcoming-1'.`);
        return require('../../assets/mascot/nubo-welcoming-1.png');
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Image
        source={getImage()}
        style={[{ width: size, height: size, resizeMode: 'contain' }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 