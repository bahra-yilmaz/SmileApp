import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput, FlatList, KeyboardAvoidingView, Platform, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../components/ThemeProvider';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import ThemedText from '../../components/ThemedText';
import { BlurView } from 'expo-blur';

// Define message type
interface Message {
  id: string;
  text: string;
  sentAt: Date;
  sender: 'me' | 'them';
}

// Define contact type
interface Contact {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

// Sample data
const CONTACTS: Record<string, Contact> = {
  '1': {
    id: '1',
    name: 'Sarah Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    online: true,
  },
  '2': {
    id: '2',
    name: 'David Williams',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    online: false,
  },
  '3': {
    id: '3',
    name: 'Emma Smith',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    online: true,
  },
  '4': {
    id: '4',
    name: 'Michael Brown',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    online: false,
  },
  '5': {
    id: '5',
    name: 'Olivia Taylor',
    avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    online: true,
  },
};

// Sample conversation data
const SAMPLE_MESSAGES: Record<string, Message[]> = {
  '1': [
    { id: '1', text: 'Hi there! How are you feeling today?', sentAt: new Date(Date.now() - 3600000 * 24), sender: 'them' },
    { id: '2', text: 'I\'m doing pretty well, thanks for asking! The mindfulness exercises have been helping a lot.', sentAt: new Date(Date.now() - 3600000 * 23), sender: 'me' },
    { id: '3', text: 'That\'s wonderful to hear! Which exercise has been most helpful for you?', sentAt: new Date(Date.now() - 3600000 * 22), sender: 'them' },
    { id: '4', text: 'Definitely the breathing techniques. They really help when I\'m feeling stressed.', sentAt: new Date(Date.now() - 3600000 * 21), sender: 'me' },
    { id: '5', text: 'Thanks for helping me smile today! 😊', sentAt: new Date(Date.now() - 3600000 * 2), sender: 'me' },
  ],
  '2': [
    { id: '1', text: 'Hey, how\'s your week going?', sentAt: new Date(Date.now() - 3600000 * 48), sender: 'them' },
    { id: '2', text: 'It\'s been pretty busy, but good overall. How about you?', sentAt: new Date(Date.now() - 3600000 * 47), sender: 'me' },
    { id: '3', text: 'Same here. Just wanted to send some positive vibes your way ✨', sentAt: new Date(Date.now() - 3600000 * 24), sender: 'them' },
  ],
  '3': [
    { id: '1', text: 'Did you try that new meditation app I recommended?', sentAt: new Date(Date.now() - 3600000 * 72), sender: 'them' },
    { id: '2', text: 'Yes! It\'s been really helpful for my evening routine.', sentAt: new Date(Date.now() - 3600000 * 70), sender: 'me' },
    { id: '3', text: 'How was your mindfulness session?', sentAt: new Date(Date.now() - 3600000 * 24), sender: 'them' },
  ],
  '4': [
    { id: '1', text: 'I noticed you\'ve been logging your goals consistently!', sentAt: new Date(Date.now() - 3600000 * 120), sender: 'them' },
    { id: '2', text: 'Yes, it\'s been keeping me accountable.', sentAt: new Date(Date.now() - 3600000 * 119), sender: 'me' },
    { id: '3', text: 'Great progress on your goals this week!', sentAt: new Date(Date.now() - 3600000 * 72), sender: 'them' },
  ],
  '5': [
    { id: '1', text: 'Hey, haven\'t chatted in a while. How are things?', sentAt: new Date(Date.now() - 3600000 * 168), sender: 'them' },
    { id: '2', text: 'Things are good! Been focusing on self-care lately.', sentAt: new Date(Date.now() - 3600000 * 167), sender: 'me' },
    { id: '3', text: 'That\'s great to hear. Let\'s catch up soon', sentAt: new Date(Date.now() - 3600000 * 120), sender: 'them' },
  ],
};

export default function ChatDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { spacing, borderRadius, activeColors } = theme;
  
  // Get contact and messages
  const contact = id ? CONTACTS[id] : null;
  const initialMessages = id ? SAMPLE_MESSAGES[id] : [];
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  
  // Format time for chat bubbles
  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Send a new message
  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sentAt: new Date(),
      sender: 'me',
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
    
    // Scroll to the newest message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };
  
  // Scroll to bottom when messages changes
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);
  
  // Render a message bubble
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender === 'me';
    
    return (
      <View style={[
        styles.messageBubbleContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMe && (
          <View style={styles.avatarSmall}>
            <Image 
              source={{ uri: contact?.avatar }}
              style={styles.avatarSmallImage}
            />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isMe ? 
            { backgroundColor: theme.colors.primary[500], marginLeft: 'auto' } : 
            { backgroundColor: theme.colorScheme === 'dark' ? 'rgba(60, 60, 60, 0.6)' : 'rgba(240, 240, 240, 0.8)' }
        ]}>
          <ThemedText style={[
            { fontSize: theme.typography.sizes.md },
            isMe && { color: 'white' }
          ]}>
            {item.text}
          </ThemedText>
          <ThemedText style={[
            styles.messageTime,
            isMe ? { color: 'rgba(255,255,255,0.8)' } : { color: activeColors.textSecondary }
          ]}>
            {formatMessageTime(item.sentAt)}
          </ThemedText>
        </View>
      </View>
    );
  };
  
  // Group messages by date for section headers
  const getMessageDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };
  
  // Messages grouped by date for section headers
  const messagesByDate = messages.reduce((acc, message) => {
    const date = getMessageDate(message.sentAt);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {} as Record<string, Message[]>);
  
  // Flatten grouped messages with section headers
  const flattenedMessages = Object.entries(messagesByDate).flatMap(([date, msgs]) => [
    { id: `header-${date}`, isHeader: true, date },
    ...msgs
  ]);
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <GlassmorphicCard
          width="100%"
          containerStyle={styles.headerContainer}
        >
          <View style={styles.headerContent}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={theme.hitSlop()}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={activeColors.text} 
              />
            </Pressable>
            
            <Pressable
              style={styles.contactInfo}
              onPress={() => {}}
            >
              <Image 
                source={{ uri: contact?.avatar }}
                style={styles.contactAvatar}
              />
              <View style={styles.contactTextContainer}>
                <ThemedText 
                  style={{ 
                    fontSize: theme.typography.sizes.md, 
                    fontFamily: theme.typography.fonts.medium
                  }}
                  numberOfLines={1}
                >
                  {contact?.name}
                </ThemedText>
                <ThemedText
                  style={{
                    fontSize: theme.typography.sizes.xs,
                    color: activeColors.textSecondary,
                  }}
                >
                  {contact?.online ? 'Online' : 'Offline'}
                </ThemedText>
              </View>
            </Pressable>
            
            <Pressable
              hitSlop={theme.hitSlop()}
              style={({ pressed }) => [
                styles.optionsButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Ionicons 
                name="ellipsis-vertical" 
                size={20} 
                color={activeColors.text} 
              />
            </Pressable>
          </View>
        </GlassmorphicCard>
        
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={flattenedMessages}
          renderItem={({ item }: { item: any }) => {
            if (item.isHeader) {
              return (
                <View style={styles.dateHeaderContainer}>
                  <View style={styles.dateHeaderLine} />
                  <ThemedText style={styles.dateHeader}>
                    {item.date}
                  </ThemedText>
                  <View style={styles.dateHeaderLine} />
                </View>
              );
            }
            return renderMessage({ item });
          }}
          keyExtractor={item => (item.isHeader ? item.id : `msg-${item.id}`)}
          style={styles.messagesList}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
          }}
        />
        
        {/* Input Area */}
        <GlassmorphicCard
          width="100%"
          containerStyle={styles.inputContainer}
          variant="input"
        >
          <View style={styles.inputWrapper}>
            <Pressable
              style={styles.attachButton}
              hitSlop={theme.hitSlop()}
            >
              <Ionicons
                name="attach"
                size={24}
                color={activeColors.textSecondary}
              />
            </Pressable>
            
            <TextInput
              style={[
                styles.textInput,
                {
                  color: activeColors.text,
                  fontFamily: theme.typography.fonts.regular,
                }
              ]}
              placeholder="Type a message..."
              placeholderTextColor={activeColors.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() ? theme.colors.primary[500] : undefined,
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? 'white' : activeColors.textSecondary}
              />
            </Pressable>
          </View>
        </GlassmorphicCard>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  contactTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  optionsButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  avatarSmall: {
    width: 28,
    height: 28,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  avatarSmallImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 18,
    maxWidth: '100%',
  },
  messageTime: {
    fontSize: 11,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  dateHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    justifyContent: 'center',
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
  dateHeader: {
    fontSize: 12,
    marginHorizontal: 8,
    opacity: 0.6,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    padding: 8,
    alignSelf: 'flex-end',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120,
    marginHorizontal: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
}); 