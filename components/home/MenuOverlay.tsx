/**
 * MenuOverlay component for displaying menu functionality in the home screen.
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, Text, Dimensions, Animated, TouchableWithoutFeedback, Platform, KeyboardAvoidingView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

// Define menu item type
interface MenuItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  route?: string;
  action?: () => void;
}

// Sample data for menu items
const MENU_ITEMS: MenuItem[] = [
  {
    id: '1',
    name: 'Profile',
    description: 'Manage your profile and settings',
    icon: 'account-circle',
    route: '/profile',
  },
  {
    id: '2',
    name: 'Statistics',
    description: 'View your brushing statistics',
    icon: 'chart-bar',
    route: '/statistics',
  },
  {
    id: '3',
    name: 'Reminders',
    description: 'Set up your brushing reminders',
    icon: 'bell',
    route: '/reminders',
  },
  {
    id: '4',
    name: 'Achievements',
    description: 'Check your brushing achievements',
    icon: 'trophy',
    route: '/achievements',
  },
  {
    id: '5',
    name: 'Settings',
    description: 'App settings and preferences',
    icon: 'cog',
    route: '/settings',
  },
];

interface MenuOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export const MenuOverlay: React.FC<MenuOverlayProps> = ({ isVisible, onClose }) => {
  const { theme } = useTheme();
  const { spacing, borderRadius, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [menuItems] = useState<MenuItem[]>(MENU_ITEMS);
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Animation values for container
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;
  
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
      });
    }
  }, [isVisible, fadeAnim, scaleAnim]);
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
  const handleMenuItemPress = (item: MenuItem) => {
    // Close the menu
    onClose();
    
    // Navigate to the route or perform action
    if (item.route) {
      // Use router.push with a cast to any to avoid type issues
      router.push(item.route as any);
    } else if (item.action) {
      item.action();
    }
  };
  
  const handleClose = () => {
    // Close when clicked outside
    onClose();
  };
  
  // Get colors for styling
  const primaryColor = theme.colors.primary[500];
  const gradientStart = theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 138, 255, 0.05)';
  const gradientEnd = theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 138, 255, 0.1)';
  
  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <Pressable
      onPress={() => handleMenuItemPress(item)}
      style={({ pressed }) => [
        styles.menuItem,
        { 
          opacity: pressed ? 0.9 : 1,
          backgroundColor: pressed 
            ? theme.colorScheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(0, 0, 0, 0.03)' 
            : 'transparent',
          marginBottom: 16,
        }
      ]}
    >
      <View style={[
        styles.iconContainer, 
        { 
          backgroundColor: theme.colorScheme === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 138, 255, 0.08)' 
        }
      ]}>
        <MaterialCommunityIcons
          name={item.icon as any}
          size={28}
          color={primaryColor}
        />
      </View>
      
      <View style={styles.menuContent}>
        <ThemedText 
          style={{ 
            fontSize: theme.typography.sizes.md, 
            fontFamily: theme.typography.fonts.medium,
          }}
          numberOfLines={1}
        >
          {item.name}
        </ThemedText>
        
        <ThemedText 
          style={{ 
            fontSize: theme.typography.sizes.sm,
            color: activeColors.textSecondary,
          }}
          numberOfLines={1}
        >
          {item.description}
        </ThemedText>
      </View>
    </Pressable>
  );
  
  // Use the exact light container color
  const backgroundColor = theme.colorScheme === 'dark' ? '#1A2235' : Colors.neutral[50];
  
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
            }
          ]}
        >
          {/* Menu Header with gradient */}
          <LinearGradient
            colors={[gradientStart, gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.menuHeader,
              { 
                borderBottomColor: theme.colorScheme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                // Lighter drop shadow like chat header
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
                zIndex: 10,
              }
            ]}
          >
            <Text 
              style={[
                styles.headerTitle,
                { 
                  fontFamily: fontsLoaded ? 'Merienda-Regular' : undefined,
                  color: primaryColor
                }
              ]}
            >
              Menu
            </Text>
          </LinearGradient>
          
          {/* Menu Items List */}
          <FlatList
            data={menuItems}
            renderItem={renderMenuItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={{ 
              paddingTop: spacing.md, 
              paddingBottom: insets.bottom > 0 ? insets.bottom : spacing.xl,
              paddingHorizontal: spacing.md 
            }}
            showsVerticalScrollIndicator={false}
          />
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
  menuHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  }
});

export default MenuOverlay; 