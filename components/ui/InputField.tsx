import React from 'react';
import { StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import GlassmorphicCard from './GlassmorphicCard';
import { useTheme } from '../ThemeProvider';

interface InputFieldProps extends TextInputProps {
  /**
   * Optional additional styles for the card container
   */
  containerStyle?: ViewStyle;
  
  /**
   * The intensity of the blur effect (0-100)
   */
  intensity?: number;
  
  /**
   * Whether to show a shadow
   */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  
  /**
   * Optional width override
   */
  width?: number;
}

/**
 * A styled input field with glassmorphic effect
 */
export default function InputField({
  containerStyle,
  intensity = 60,
  shadow = 'none',
  placeholder,
  width = 260,
  ...restProps
}: InputFieldProps) {
  const { theme } = useTheme();
  const { colors } = theme;
  
  return (
    <GlassmorphicCard 
      style={[
        styles.inputCard,
        { borderRadius: 25, width },
        containerStyle
      ]}
      variant="input"
      intensity={intensity}
      shadow={shadow}
    >
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="rgba(255, 255, 255, 0.7)"
        {...restProps}
      />
    </GlassmorphicCard>
  );
}

const styles = StyleSheet.create({
  inputCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  input: {
    width: '100%',
    padding: 16,
    fontSize: 18,
    color: 'white',
    fontFamily: 'Quicksand-Regular',
    textAlign: 'left',
    paddingLeft: 20,
  },
}); 