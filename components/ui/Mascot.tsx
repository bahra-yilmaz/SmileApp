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

      // --- Cool Category ---
      case 'nubo-cool-1': // New for stage 3 Expanded (nubo-cool-1.png)
        return require('../../assets/mascot/nubo-cool-1.png');
      case 'nubo-cool-2': // New for stage 3 Expanded (nubo-cool-2.png)
        return require('../../assets/mascot/nubo-cool-2.png');
      case 'nubo-cool-3': // New for stage 3 Expanded (nubo-cool-3.png)
        return require('../../assets/mascot/nubo-cool-3.png');
      case 'nubo-cool-4': // New for stage 3 Expanded (nubo-cool-4.png)
        return require('../../assets/mascot/nubo-cool-4.png');
      case 'nubo-cool-5': // New for stage 3 Expanded (nubo-cool-5.png)
        return require('../../assets/mascot/nubo-cool-5.png');
      case 'nubo-cool-1-pp': // New for stage 3 PP (nubo-cool-1-pp.png)
        return require('../../assets/mascot/nubo-cool-1-pp.png');
      case 'nubo-cool-2-pp': // New for stage 3 PP (nubo-cool-2-pp.png)
        return require('../../assets/mascot/nubo-cool-2-pp.png');
      case 'nubo-cool-3-pp': // New for stage 3 PP (nubo-cool-3-pp.png)
        return require('../../assets/mascot/nubo-cool-3-pp.png');

      // --- Daily Routine Category ---
      case 'nubo-daily-brush': // For nubo-brushing-1.png
        return require('../../assets/mascot/nubo-brushing-1.png');
      case 'nubo-brushing-1-pp': // For stage 2 PP (nubo-brushing-1-pp.png)
        return require('../../assets/mascot/nubo-brushing-1-pp.png');
      case 'nubo-daily-brush-2': // For stage 2 Expanded (nubo-brushing-2.png)
        return require('../../assets/mascot/nubo-brushing-2.png');
      // case 'nubo-brushing-2-pp': // Removed
      //  return require('../../assets/mascot/nubo-brushing-2-pp.png');

      // --- Timer Category ---
      // case 'nubo-timer-1': // Removed
      //   return require('../../assets/mascot/nubo-timer-1.png');

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