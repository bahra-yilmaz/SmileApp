import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '../ThemeProvider'; // Assuming ThemeProvider is in components
import { Colors } from '../../constants/Colors'; // Import Colors
import { Ionicons } from '@expo/vector-icons';

interface ConfirmModalProps {
  /** Controls the visibility of the modal */
  visible: boolean;

  /** Icon element to render in the top-left corner of the card (optional) */
  icon?: React.ReactNode;

  /** Name of the Ionicons icon to display */
  iconName?: keyof typeof Ionicons.glyphMap;
  
  /** Color of the icon */
  iconColor?: string;

  /** Short header text shown below the icon */
  title?: string;

  /** Detailed explanatory text */
  message?: string;

  /** Confirm button label */
  confirmText?: string;

  /** Cancel button label */
  cancelText?: string;

  /** Called when user confirms */
  onConfirm: () => void;

  /** Called when user cancels / closes */
  onCancel: () => void;

  /** Whether to show the cancel button. Defaults to true. */
  showCancel?: boolean;

  /** Background dim amount (0-1). Set 0 for no backdrop. Default 0.6 */
  dimAmount?: number;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  icon,
  iconName,
  iconColor,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  showCancel = true,
  dimAmount = 0.6,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Fade-in animation
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacityAnim.setValue(0);
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacityAnim]);

  // Local inline button component that scales with flexbox
  const ModalButton = ({ label, variant, onPress }: { label: string; variant: 'primary' | 'secondary'; onPress: () => void }) => {
    // Right-side button ("primary") should have an off-white background & red text
    const isPrimary = variant === 'primary';
    const backgroundColor = isPrimary ? Colors.neutral[100] : Colors.primary[600];
    const textColor = isPrimary ? '#D32F2F' /* destructive red from ReminderItem */ : Colors.neutral[50];

    return (
      <Pressable
        onPress={onPress}
        style={[styles.modalButton, { backgroundColor }]}
      >
        <Text style={[styles.modalButtonText, { color: textColor }]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={[styles.centeredView, { backgroundColor: dimAmount > 0 ? `rgba(0,0,0,${dimAmount})` : 'transparent' }] }>
        <Animated.View style={[styles.modalView, { opacity: opacityAnim }] }>
          {/* Close   */}
          <Pressable onPress={onCancel} style={styles.closeButton} hitSlop={8}>
            <Ionicons name="close" size={20} color={theme.activeColors.text} />
          </Pressable>

          {/* Icon */}
          {iconName && (
            <View style={styles.iconWrapper}>
              <Ionicons name={iconName} size={32} color={iconColor || theme.activeColors.text} />
            </View>
          )}
          {icon && !iconName ? <View style={styles.iconWrapper}>{icon}</View> : null}

          {/* Header */}
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}

          {/* Message */}
          {message ? (
            <Text style={styles.modalMessage}>{message}</Text>
          ) : null}

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && <ModalButton label={cancelText} variant="secondary" onPress={onCancel} />}
            <ModalButton label={confirmText} variant="primary" onPress={onConfirm} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any) => StyleSheet.create({ // Use 'any' for theme if type is complex
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)', // Dimmed background
  },
  modalView: {
    margin: 20,
    backgroundColor: theme.activeColors.background,
    borderRadius: 35,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'flex-start', // Left-align internal content
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'left',
    color: theme.activeColors.text,
    fontFamily: theme.fonts?.heading || 'System',
  },
  modalMessage: {
    marginBottom: 20,
    textAlign: 'left',
    fontSize: 16,
    color: theme.activeColors.textSecondary || theme.activeColors.text,
    fontFamily: theme.fonts?.body || 'System',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  modalButtonText: {
    color: Colors.neutral[50],
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ConfirmModal; 