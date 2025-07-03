import React, { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';

interface InlineEditableTextProps {
  /** Current text value */
  value: string;
  /** Called when user saves a new value */
  onSave: (newValue: string) => void | Promise<void>;
  /** Optional styling overrides */
  textStyle?: TextStyle;
  inputStyle?: TextStyle;
  /** Icon/text color (e.g., theme tint) */
  color?: string;
  /** Color for pencil icon (defaults to color) */
  pencilColor?: string;
  /** Color for checkmark icon (defaults to pencilColor) */
  checkmarkColor?: string;
  /** Opacity applied to pencil icon (0-1) */
  iconOpacity?: number;
}

/**
 * Displays text that can be edited in-place. When not editing, shows a pencil icon.
 * On tap, swaps to a TextInput with a checkmark confirmation icon.
 */
export const InlineEditableText: React.FC<InlineEditableTextProps> = ({
  value,
  onSave,
  textStyle,
  inputStyle,
  color,
  pencilColor,
  checkmarkColor,
  iconOpacity = 1,
}) => {
  const { theme } = useTheme();
  const appliedColor = color ?? theme.activeColors.text;
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<TextInput>(null);

  // Keep internal state synced when parent updates value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Auto-focus on edit
  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      // Empty values revert
      setIsEditing(false);
      setInputValue(value);
      return;
    }

    if (trimmed !== value) {
      await onSave(trimmed);
    }
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      {isEditing ? (
        <>
          <TextInput
            ref={inputRef}
            value={inputValue}
            onChangeText={setInputValue}
            onSubmitEditing={handleSave}
            onBlur={handleSave}
            autoCapitalize="none"
            style={[styles.input, { color: appliedColor }, inputStyle]}
            placeholderTextColor={appliedColor}
          />
          <Pressable onPress={handleSave} hitSlop={10}>
            <Ionicons name="checkmark" size={18} color={checkmarkColor ?? pencilColor ?? appliedColor} />
          </Pressable>
        </>
      ) : (
        <>
          <Text style={[styles.text, { color: appliedColor }, textStyle]}>{value}</Text>
          <Pressable onPress={() => setIsEditing(true)} hitSlop={10} style={{ marginLeft: 4 }}>
            <Ionicons name="create-outline" size={18} color={pencilColor ?? appliedColor} style={{ opacity: iconOpacity }} />
          </Pressable>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontFamily: 'Quicksand-Bold',
  },
  input: {
    fontSize: 22,
    fontFamily: 'Quicksand-Bold',
    marginRight: 4,
  },
});

export default InlineEditableText; 