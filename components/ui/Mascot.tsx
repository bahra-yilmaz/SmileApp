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
      case 'nubo-wise-1-pp':
        return require('../../assets/mascot/nubo-wise-1-pp.png');
      // case 'nubo-wise-book':
      //   return require('../../assets/mascot/nubo-wise-book.png');
      // case 'nubo-wise-book-pp':
      //   return require('../../assets/mascot/nubo-wise-book-pp.png');

      // --- Welcoming Category ---
      case 'nubo-welcoming-1':
        return require('../../assets/mascot/nubo-welcoming-1.png');
      case 'nubo-welcoming-1-pp':
        return require('../../assets/mascot/nubo-welcoming-1-pp.png');
      case 'nubo-welcoming-2':
        return require('../../assets/mascot/nubo-welcoming-2.png');
      // case 'nubo-welcoming-2-pp':
      //  return require('../../assets/mascot/nubo-welcoming-2-pp.png');
      case 'nubo-welcoming-wave':
        return require('../../assets/mascot/nubo-waving-1.png');
      // case 'nubo-welcoming-wave-pp':
      //   return require('../../assets/mascot/nubo-welcoming-wave-pp.png');

      // --- Playful Category (Assets not provided for these examples) ---
      // case 'nubo-playful-dance':
      //   return require('../../assets/mascot/nubo-playful-dance.png');
      // case 'nubo-playful-dance-pp':
      //   return require('../../assets/mascot/nubo-playful-dance-pp.png');
      // case 'nubo-playful-peek':
      //   return require('../../assets/mascot/nubo-playful-peek.png');
      // case 'nubo-playful-peek-pp':
      //   return require('../../assets/mascot/nubo-playful-peek-pp.png');

      // --- Daily Routine Category ---
      case 'nubo-daily-brush':
        return require('../../assets/mascot/nubo-brushing-1.png');
      // case 'nubo-daily-brush-pp':
      //   return require('../../assets/mascot/nubo-daily-brush-pp.png');

      // --- Generic / Accessory Focused (Assets not provided for these examples) ---
      // case 'nubo-generic-glasses':
      //   return require('../../assets/mascot/nubo-generic-glasses.png');
      // case 'nubo-generic-glasses-pp':
      //   return require('../../assets/mascot/nubo-generic-glasses-pp.png');

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