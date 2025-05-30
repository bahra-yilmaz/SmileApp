import React from 'react';
import { View, ViewProps } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';

interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
}

export const ThemedView = (props: ThemedViewProps) => {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}; 