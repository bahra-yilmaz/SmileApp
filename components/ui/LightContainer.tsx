import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface LightContainerProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  backgroundColor?: string;
}

/**
 * A light-colored container component that can be used to wrap content
 * and extends to the bottom edge of the screen with no rounded corners
 */
export default function LightContainer({
  children,
  style,
  backgroundColor = '#F3F9FF',
}: LightContainerProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 0,
    padding: 16,
    marginBottom: 0,
  },
}); 