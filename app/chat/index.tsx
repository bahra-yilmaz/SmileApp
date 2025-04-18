import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../components/ThemeProvider';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import ThemedText from '../../components/ThemedText';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

// Define chat item type
interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar: string;
  unread: number;
}

// Sample data for chat list
const CHATS: ChatItem[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    lastMessage: 'Thanks for helping me smile today! 😊',
    time: '10:30 AM',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    unread: 2,
  },
  {
    id: '2',
    name: 'David Williams',
    lastMessage: 'Sending positive vibes your way ✨',
    time: 'Yesterday',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    unread: 0,
  },
  {
    id: '3',
    name: 'Emma Smith',
    lastMessage: 'How was your mindfulness session?',
    time: 'Yesterday',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    unread: 0,
  },
  {
    id: '4',
    name: 'Michael Brown',
    lastMessage: 'Great progress on your goals this week!',
    time: 'Monday',
    avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
    unread: 5,
  },
  {
    id: '5',
    name: 'Olivia Taylor',
    lastMessage: 'Let\'s catch up soon',
    time: 'Sunday',
    avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    unread: 0,
  },
];

export default function ChatList() {
  const { theme } = useTheme();
  const { spacing, borderRadius, activeColors } = theme;
  const router = useRouter();
  const [chats] = useState<ChatItem[]>(CHATS);

  const navigateToChat = (chatId: string) => {
    router.push(`/chat/${chatId}` as any);
  };

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
          marginBottom: spacing.md,
        }
      ]}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.avatar }} 
          style={styles.avatar} 
        />
        {item.unread > 0 && (
          <View style={[
            styles.badge, 
            { 
              backgroundColor: theme.colors.accent[500],
              borderColor: activeColors.background,
            }
          ]}>
            <Text style={styles.badgeText}>{item.unread}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <ThemedText 
            style={{ 
              fontSize: theme.typography.sizes.md, 
              fontFamily: theme.typography.fonts.medium
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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Header */}
        <GlassmorphicCard
          width="100%"
          containerStyle={[
            styles.headerContainer,
            { marginBottom: spacing.md }
          ]}
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
            
            <ThemedText 
              style={{ 
                fontSize: theme.typography.sizes.lg,
                fontFamily: theme.typography.fonts.displayMedium,
              }}
            >
              Chats
            </ThemedText>
            
            <Pressable
              hitSlop={theme.hitSlop()}
              style={({ pressed }) => [
                styles.newChatButton,
                { opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Ionicons 
                name="create-outline" 
                size={24} 
                color={activeColors.text} 
              />
            </Pressable>
          </View>
        </GlassmorphicCard>
        
        {/* Search Bar */}
        <GlassmorphicCard
          width="100%"
          containerStyle={[
            styles.searchContainer,
            { marginBottom: spacing.lg }
          ]}
          variant="input"
        >
          <View style={styles.searchContent}>
            <Ionicons 
              name="search" 
              size={20} 
              color={activeColors.textSecondary} 
            />
            <ThemedText 
              style={{ 
                fontSize: theme.typography.sizes.md,
                color: activeColors.textSecondary,
                marginLeft: spacing.sm,
              }}
            >
              Search chats
            </ThemedText>
          </View>
        </GlassmorphicCard>
        
        {/* Chat List */}
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          contentContainerStyle={{ 
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.xl * 2,
          }}
        />
      </SafeAreaView>
    </View>
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
    marginTop: 0,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  newChatButton: {
    padding: 4,
  },
  searchContainer: {
    marginHorizontal: 16,
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  list: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  badge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
}); 