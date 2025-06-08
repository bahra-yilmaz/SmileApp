/**
 * ChatOverlay component for displaying chat functionality in the home screen.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, FlatList, Pressable, Image, Text, Dimensions, Animated, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import ThemedText from '../ThemedText';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';

// Define chat item type
interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string | number;
  unread: number;
  isTeam?: boolean;
}

// Define message type
interface Message {
  id: string;
  text: string;
  timestamp: string;
  fromUser: boolean;
}

interface ChatOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const ChatOverlay: React.FC<ChatOverlayProps> = ({ isVisible, onClose }) => {
  const { t } = useTranslation();

  const { theme } = useTheme();
  const { spacing, borderRadius, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [chats] = useState<ChatItem[]>([
    {
      id: '0',
      name: t('chatOverlay.smileTeamName'),
      lastMessage: t('chatOverlay.welcomeMessage'),
      time: t('chatOverlay.justNow'),
      avatar: require('../../assets/images/logo.png'),
      unread: 1,
      isTeam: true,
    }
  ]);
  const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
  const flatListRef = useRef<FlatList>(null);
  
  // Track keyboard status
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Start with more messages to test scrolling
  const [messages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatOverlay.welcomeMessage'),
      timestamp: t('chatOverlay.justNow'),
      fromUser: false,
    }
  ]);
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // State to track if we're in conversation mode
  const [isConversationMode, setIsConversationMode] = useState(false);
  
  // Animation values for container
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [scaleAnim] = useState(() => new Animated.Value(0.95));
  const [modeAnim] = useState(() => new Animated.Value(0));
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9; // Wider container - 90% of screen width
  
  // Calculate height based on mode and keyboard
  const getOverlayHeight = () => {
    if (!isConversationMode) {
      return Math.min(100, screenHeight * 0.15); // Compact in preview mode
    }
    
    // For conversation mode, adjust height when keyboard is visible
    if (keyboardVisible) {
      // Calculate available height (screen height minus keyboard and safe areas)
      const availableHeight = screenHeight - keyboardHeight - insets.top - 20;
      // Use the smaller of either 70% of screen or available height
      return Math.min(availableHeight, screenHeight * 0.7);
    }
    
    return screenHeight * 0.7; // Default taller height for conversation mode
  };
  
  // Update mode animation when mode changes
  useEffect(() => {
    Animated.timing(modeAnim, {
      toValue: isConversationMode ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConversationMode]);
  
  // Handle animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      setAnimationComplete(true);
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Set animation complete to false after animation is done
        setAnimationComplete(false);
        // Reset conversation mode when closed
        setIsConversationMode(false);
      });
    }
  }, [isVisible, fadeAnim, scaleAnim]);
  
  // Scroll to bottom when messages change or conversation mode changes
  useEffect(() => {
    if (flatListRef.current && isConversationMode) {
      // Short delay to ensure layout has completed
      const timeout = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
      
      return () => clearTimeout(timeout);
    }
  }, [messages, isConversationMode]);
  
  // Scroll to bottom when first entering conversation mode with a smoother animation
  useEffect(() => {
    if (isConversationMode && flatListRef.current) {
      // First wait for animation to complete
      const initialTimeout = setTimeout(() => {
        // Then scroll without animation to position
        flatListRef.current?.scrollToEnd({ animated: false });
        
        // Then after a short delay, apply a subtle animated scroll to ensure we're at the end
        // This creates a smoother visual effect
        const finalTimeout = setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
        
        return () => clearTimeout(finalTimeout);
      }, 300);
      
      return () => clearTimeout(initialTimeout);
    }
  }, [isConversationMode]);
  
  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );
    
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  const navigateToChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChat(chat);
      setIsConversationMode(true);
    }
  };

  const handleBackToPreview = () => {
    setIsConversationMode(false);
  };

  const handleClose = () => {
    // Always close completely when clicked outside
    onClose();
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.fromUser ? styles.userMessageContainer : styles.systemMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.fromUser ? 
          [styles.userMessageBubble, { backgroundColor: Colors.primary[500] }] : 
          [styles.systemMessageBubble, { backgroundColor: theme.colorScheme === 'dark' ? 'rgba(52, 53, 65, 0.7)' : 'rgba(247, 247, 248, 0.7)' }]
      ]}>
        {!item.fromUser && (
          <View style={styles.senderInfo}>
            <Image
              source={typeof chats[0].avatar === 'string' ? { uri: chats[0].avatar } : chats[0].avatar}
              style={[styles.messageAvatar, chats[0].isTeam && styles.teamAvatarMessage]}
            />
            <ThemedText style={styles.senderName}>
              {chats[0].name}
            </ThemedText>
          </View>
        )}
        <ThemedText
          style={[
            styles.messageText,
            { color: item.fromUser ? '#fff' : activeColors.text }
          ]}
        >
          {item.text}
        </ThemedText>
      </View>
    </View>
  );

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <Pressable
      onPress={() => navigateToChat(item.id)}
      style={({ pressed }) => [
        styles.chatItem,
        { 
          opacity: pressed ? 0.9 : 1,
          backgroundColor: pressed 
            ? 'rgba(150, 150, 150, 0.1)' 
            : 'transparent',
          marginBottom: 8,
        }
      ]}
    >
      <View style={styles.avatarContainer}>
        {typeof item.avatar === 'string' ? (
          <Image 
            source={{ uri: item.avatar }} 
            style={styles.avatar} 
          />
        ) : (
          <Image 
            source={item.avatar} 
            style={[styles.avatar, item.isTeam && styles.teamAvatar]} 
            resizeMode="contain"
          />
        )}
        {item.unread > 0 && (
          <View style={[
            styles.badge, 
            { 
              backgroundColor: Colors.primary[300],
              borderColor: 'rgba(255, 255, 255, 0.5)',
            }
          ]} />
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText 
            style={{ 
              fontSize: theme.typography.sizes.md, 
              fontFamily: theme.typography.fonts.medium,
              color: item.isTeam ? Colors.primary[500] : undefined,
            }}
            numberOfLines={1}
          >
            {item.name}
          </ThemedText>
          <ThemedText 
            style={{ 
              fontSize: theme.typography.sizes.xs,
              color: activeColors.textSecondary,
            }}
            numberOfLines={1}
          >
            {item.time}
          </ThemedText>
        </View>
        
        <ThemedText 
          style={{ 
            fontSize: theme.typography.sizes.sm,
            color: item.unread > 0 
              ? activeColors.text 
              : activeColors.textSecondary,
            fontFamily: item.unread > 0 
              ? theme.typography.fonts.medium 
              : theme.typography.fonts.regular,
          }}
          numberOfLines={1}
        >
          {item.lastMessage}
        </ThemedText>
      </View>
    </Pressable>
  );

  // Use the exact light container color
  const backgroundColor = theme.colorScheme === 'dark' ? '#1A2235' : Colors.neutral[50];
  
  // Calculate the overlay height
  const overlayHeight = getOverlayHeight();

  // Position for the overlay - move up when keyboard is visible
  const overlayPosition = keyboardVisible && isConversationMode ? 
    { 
      transform: [{ translateY: -Math.min(keyboardHeight / 5, 50) }],
      maxHeight: screenHeight - keyboardHeight + 150 // Further increased to prevent cutting off
    } : 
    undefined;

  return (
    <View style={[StyleSheet.absoluteFill, styles.mainContainer]}>
      {/* Backdrop - covers the entire screen and handles touches outside the overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View 
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: fadeAnim,
                backgroundColor: 'rgba(0,0,0,0.5)',
              }
            ]}
          >
            <BlurView
              intensity={20}
              tint={theme.colorScheme}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      
      {/* Overlay Container - contains the actual overlay content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'position' : 'height'} 
        style={styles.centerContainer} 
        pointerEvents="box-none"
        keyboardVerticalOffset={0}
      >
        <Animated.View 
          style={[
            styles.overlayContainer, 
            {
              width: overlayWidth,
              height: overlayHeight,
              borderRadius: 28,
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
              ],
              backgroundColor,
              // Enhanced shadow
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 20,
              borderWidth: 0,
              padding: 0,
              overflow: 'hidden',
            },
            overlayPosition
          ]}
        >
          {isConversationMode ? (
            <Animated.View 
              style={[
                styles.conversationContainer,
                { 
                  opacity: modeAnim,
                  transform: [
                    { scale: modeAnim.interpolate({ 
                      inputRange: [0, 1], 
                      outputRange: [0.95, 1] 
                    }) }
                  ] 
                }
              ]}
            >
              {/* Fixed layout with flex-based structure */}
              <View style={{ flex: 1, flexDirection: 'column' }}>
                {/* Header with back button and chat name */}
                <View style={[
                  styles.conversationHeader, 
                  { backgroundColor: theme.colorScheme === 'dark' ? '#1A2235' : Colors.neutral[50] }
                ]}>
                  <Pressable 
                    onPress={handleBackToPreview}
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.7 : 1,
                      padding: 8
                    })}
                  >
                    <Ionicons 
                      name="arrow-back" 
                      size={24} 
                      color={activeColors.text} 
                    />
                  </Pressable>
                  
                  <View style={styles.headerTitleContainer}>
                    <Text 
                      style={[
                        styles.headerTitle,
                        { 
                          fontFamily: fontsLoaded ? 'Merienda-Regular' : undefined,
                          color: activeColors.text
                        }
                      ]}
                    >
                      {selectedChat?.name}
                    </Text>
                  </View>
                </View>
                
                {/* Scrollable content area */}
                <View style={styles.messagesList}>
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.messagesListContent}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View 
              style={[
                styles.previewContainer,
                { 
                  opacity: modeAnim.interpolate({
                    inputRange: [0, 0.3],
                    outputRange: [1, 0]
                  }),
                  transform: [
                    { scale: modeAnim.interpolate({ 
                      inputRange: [0, 0.3], 
                      outputRange: [1, 0.95] 
                    }) }
                  ] 
                }
              ]}
            >
              <View style={styles.singleConversation}>
                {/* Chat Item */}
                <Pressable
                  onPress={() => navigateToChat(chats[0].id)}
                  style={({ pressed }) => [
                    styles.chatItem,
                    { 
                      opacity: pressed ? 0.9 : 1,
                      backgroundColor: pressed 
                        ? 'rgba(150, 150, 150, 0.1)' 
                        : 'transparent',
                      marginBottom: 0, // No margin bottom needed for single item
                    }
                  ]}
                >
                  <View style={styles.avatarContainer}>
                    {typeof chats[0].avatar === 'string' ? (
                      <Image 
                        source={{ uri: chats[0].avatar }} 
                        style={styles.avatar} 
                      />
                    ) : (
                      <Image 
                        source={chats[0].avatar} 
                        style={[styles.avatar, chats[0].isTeam && styles.teamAvatar]} 
                        resizeMode="contain"
                      />
                    )}
                    {chats[0].unread > 0 && (
                      <View style={[
                        styles.badge, 
                        { 
                          backgroundColor: Colors.primary[300],
                          borderColor: 'rgba(255, 255, 255, 0.5)',
                        }
                      ]} />
                    )}
                  </View>
                  
                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <ThemedText 
                        style={{ 
                          fontSize: theme.typography.sizes.md, 
                          fontFamily: theme.typography.fonts.medium,
                          color: chats[0].isTeam ? Colors.primary[500] : undefined,
                        }}
                        numberOfLines={1}
                      >
                        {chats[0].name}
                      </ThemedText>
                      <ThemedText 
                        style={{ 
                          fontSize: theme.typography.sizes.xs,
                          color: activeColors.textSecondary,
                        }}
                        numberOfLines={1}
                      >
                        {chats[0].time}
                      </ThemedText>
                    </View>
                    
                    <ThemedText 
                      style={{ 
                        fontSize: theme.typography.sizes.sm,
                        color: chats[0].unread > 0 
                          ? activeColors.text 
                          : activeColors.textSecondary,
                        fontFamily: chats[0].unread > 0 
                          ? theme.typography.fonts.medium 
                          : theme.typography.fonts.regular,
                      }}
                      numberOfLines={1}
                    >
                      {chats[0].lastMessage}
                    </ThemedText>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    position: 'absolute',
    zIndex: 9999,
    elevation: 1000,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    overflow: 'hidden',
    flexDirection: 'column',
  },
  singleConversation: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    height: '100%',
    justifyContent: 'center', // Center the content vertically
  },
  searchContainer: {
    height: 40,
  },
  searchContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0, // Remove all padding
    borderRadius: 12,
    marginBottom: 0,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 8, // Reduced from 12px to 8px to reduce gap
  },
  avatar: {
    width: 50, // Increased from 36px to 50px
    height: 50, // Increased from 36px to 50px
    borderRadius: 12, // Keep the same rounded corner style
  },
  teamAvatar: {
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderRadius: 12, // Keep the same style
  },
  teamAvatarMessage: {
    backgroundColor: '#fff',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderRadius: 12, // Ensure consistent border radius with the chat item
    width: 40, // Increase size to match the image
    height: 40, // Increase size to match the image
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary[300],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  chatContent: {
    flex: 1,
    marginLeft: 8, // Reduced from 12px to 8px to reduce gap
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  // Conversation mode styles
  conversationContainer: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
    // Lighter drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 32, // To account for the back button on the left
  },
  headerTitle: {
    fontSize: 20, // Reduced from 24 to 20
    fontWeight: '400', // Lighter weight for Regular font
    letterSpacing: 0.5, // Added letter spacing for Merienda font
  },
  scrollContainer: {
    flex: 1,
    height: '100%',
  },
  messagesList: {
    flex: 1,
    width: '100%',
  },
  messagesListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    width: '100%',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  systemMessageContainer: {
    justifyContent: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAvatar: {
    width: 40, // Increased size
    height: 40, // Increased size
    borderRadius: 12, // Not a circle, matches the rounded corners in the image
    marginRight: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600',
  },
  messageBubble: {
    padding: 16,
    borderRadius: 20,
    maxWidth: '90%',
  },
  userMessageBubble: {
    alignSelf: 'flex-end',
  },
  systemMessageBubble: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  messageTimestamp: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  previewContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ChatOverlay; 