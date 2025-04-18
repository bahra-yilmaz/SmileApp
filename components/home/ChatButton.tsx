import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { useRouter } from 'expo-router';

interface ChatButtonProps {
  hasUnreadMessages?: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  hasUnreadMessages = true,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animation for badge pulsing
  const badgePulse = useRef(new Animated.Value(1)).current;
  
  // Setup badge pulsing animation
  useEffect(() => {
    if (hasUnreadMessages) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(badgePulse, {
            toValue: 1.5,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(badgePulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          })
        ])
      ).start();
    }
    
    return () => {
      badgePulse.stopAnimation();
    };
  }, [hasUnreadMessages]);
  
  // Navigate to chat screen
  const navigateToChat = () => {
    router.push('/chat');
  };

  return (
    <Pressable
      onPress={navigateToChat}
      style={({ pressed }) => [
        styles.chatButton,
        {
          top: insets.top + 13, // Positioned slightly higher
          transform: [{ scale: pressed ? 0.95 : 1 }]
        }
      ]}
    >
      <View style={styles.chatButtonContainer}>
        <Ionicons name="mail" size={28} color="white" />
        
        {/* Notification Badge */}
        {hasUnreadMessages && (
          <View style={styles.badgeContainer}>
            <View style={styles.badge} />
            <Animated.View 
              style={[
                styles.badgeRipple,
                {
                  transform: [{ scale: badgePulse }],
                  opacity: badgePulse.interpolate({
                    inputRange: [1, 1.5],
                    outputRange: [0.6, 0]
                  })
                }
              ]} 
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chatButton: {
    position: 'absolute',
    right: 20,
    zIndex: 15,
  },
  chatButtonContainer: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 3,
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary[300],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  badgeRipple: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary[300],
    position: 'absolute',
    top: -5,
    left: -5,
    zIndex: -1,
  },
});

export default ChatButton; 