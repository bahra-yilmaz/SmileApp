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
  variant = 'waving',
  containerStyle,
  imageStyle,
  size = 100,
}: MascotProps) {
  // Get the right image based on variant
  const getImage = () => {
    switch (variant) {
      case 'waving':
        return require('../../assets/mascot/nubo-waving-1.png');
      case 'glasses':
        return require('../../assets/mascot/nubo-glasses-1.png');
      case 'glasses-1-pp':
        return require('../../assets/mascot/nubo-glasses-1-pp.png');
      case 'brushing':
        return require('../../assets/mascot/nubo-brushing-1.png');
      case 'welcoming':
        return require('../../assets/mascot/nubo-welcoming-1.png');
      default:
        return require('../../assets/mascot/nubo-waving-1.png');
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