import React from 'react';
import { StyleSheet, View, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import type { MascotVariant } from '../../types/mascot';
import { AppImages } from '../../utils/loadAssets';

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
  const imageSource = AppImages[variant] || AppImages['nubo-welcoming-1'];

  if (!AppImages[variant]) {
    console.warn(`Mascot variant "${variant}" not found, using default 'nubo-welcoming-1'.`);
  }
  
  return (
    <View style={[styles.container, { width: size, height: size }, containerStyle]}>
      <Image
        source={imageSource}
        style={[{ width: size, height: size }, imageStyle]}
        contentFit="contain"
        cachePolicy="disk"
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