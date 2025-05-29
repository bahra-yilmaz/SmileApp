import React from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../ThemeProvider'; // Assuming ThemeProvider is in components
import PrimaryButton from '../ui/PrimaryButton';
import { Colors } from '../../constants/Colors'; // Import Colors

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message.split('\n')[1]}</Text>
          <View style={styles.buttonContainer}>
            <PrimaryButton
              label={cancelText}
              onPress={onCancel}
              style={{
                ...styles.buttonStyle,
                ...styles.cancelButton,
                backgroundColor: Colors.primary[200], // Changed to primary[200]
                shadowOpacity: 0,
                elevation: 0,
              }}
              textStyle={{ color: Colors.neutral[50] }} // Changed to white text
              width={155} // Adjusted width from 130 to 140
            />
            <PrimaryButton
              label={confirmText}
              onPress={onConfirm}
              style={{
                ...styles.buttonStyle,
                ...styles.confirmButton,
                backgroundColor: Colors.primary[500], // Primary 600 bg
                shadowOpacity: 0,
                elevation: 0,
              }}
              textStyle={{ color: Colors.neutral[50] }} // Corrected: White text
              width={155} // Adjusted width from 130 to 140
            />
          </View>
        </View>
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
    borderRadius: 45, // Updated to match ToothbrushOverlay
    paddingVertical: 20,   // Adjusted vertical padding
    paddingHorizontal: 15, // Adjusted horizontal padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: theme.activeColors.text,
    fontFamily: theme.fonts?.heading || 'System', // Example font
  },
  modalMessage: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    color: theme.activeColors.textSecondary || theme.activeColors.text,
    fontFamily: theme.fonts?.body || 'System', // Example font
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed to space-around for better spacing
    width: '100%',
    marginTop: 10, // Added margin for spacing from message
  },
  buttonStyle: {
    // General button style for modal, shadow is overridden inline
    marginVertical: 0, // Remove default margin from PrimaryButton's shadowContainer
    borderRadius: 30, // Updated to match PrimaryButton default for consistency
  },
  cancelButton: {
    // Specific styles for cancel button if needed beyond color
    // e.g. borderWidth: 1, borderColor: Colors.primary[600] (if you want a border)
  },
  confirmButton: {
    // Specific styles for confirm button if needed
  },
});

export default ConfirmModal; 