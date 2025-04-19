/**
 * Empty overlay component with no content or functionality.
 */

import React from 'react';
import { 
  View, 
  StyleSheet,
  TouchableWithoutFeedback
} from 'react-native';
import { useTheme } from '../ThemeProvider';

interface OverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const TimerOverlay: React.FC<OverlayProps> = ({ isVisible, onClose }) => {
  // If not visible, don't render anything
  if (!isVisible) return null;
  
  // Get theme color
  const { theme } = useTheme();
  const backgroundColor = theme.colorScheme === 'dark' ? '#000000' : '#FFFFFF';
  
  return (
    <TouchableWithoutFeedback onPress={onClose}>
      <View style={[styles.fullScreenContainer, { backgroundColor }]} />
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1500,
  }
});

export default TimerOverlay; 