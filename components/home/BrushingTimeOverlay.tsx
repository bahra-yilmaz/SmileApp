import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  Animated, 
  Pressable, 
  TouchableWithoutFeedback, 
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { Colors } from '../../constants/Colors';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ThemedText from '../ThemedText';
import DonutChart from '../ui/DonutChart';

interface BrushingTimeOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  minutes: number;
  seconds: number;
  targetMinutes?: number;
}

interface BrushingTimeItem {
  id: string;
  name: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  action?: () => void;
}

const BRUSHING_TIME_ITEMS: BrushingTimeItem[] = [
  {
    id: '1',
    name: 'Brushing Technique',
    description: 'Learn the best technique for effective brushing',
    icon: 'toothbrush',
  },
  {
    id: '2',
    name: 'Set Target Time',
    description: 'Customize your target brushing time',
    icon: 'clock-time-three',
  },
  {
    id: '3',
    name: 'View History',
    description: 'See your brushing duration history',
    icon: 'chart-line',
  },
  {
    id: '4',
    name: 'Set Reminders',
    description: 'Configure brushing time reminders',
    icon: 'bell-ring',
  }
];

export const BrushingTimeOverlay: React.FC<BrushingTimeOverlayProps> = ({ 
  isVisible, 
  onClose, 
  minutes, 
  seconds, 
  targetMinutes = 3 
}) => {
  const { theme } = useTheme();
  const { activeColors } = theme;
  
  // Animation values for container
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // State to track if animation is completed
  const [animationComplete, setAnimationComplete] = useState(false);
  
  // Load Merienda font for header
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate dimensions to leave space around edges
  const overlayWidth = screenWidth * 0.9;
  const overlayHeight = screenHeight * 0.7;
  
  // Calculate progress as a percentage
  const progress = ((minutes + seconds / 60) / targetMinutes) * 100;
  
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
  
  const handleClose = () => {
    onClose();
  };
  
  const handleBrushingTimeItemPress = (item: BrushingTimeItem) => {
    // Handle item press logic
    if (item.action) {
      item.action();
    }
    // Optionally close overlay or navigate
  };
  
  // ListHeaderComponent with Brushing Time Info
  const BrushingTimeHeader = () => (
    <View>
      <View style={styles.headerContainer}>
        <View style={styles.iconBackdrop}>
          <DonutChart
            progress={progress}
            size={90}
            thickness={16}
            progressColor={theme.colorScheme === 'dark' ? Colors.primary[400] : Colors.primary[700]}
            style={styles.timeDonut}
          />
        </View>
        <View style={styles.headerTextContainer}>
          <ThemedText
            style={[
              styles.brushingTimeTitle,
              { fontFamily: fontsLoaded ? 'Merienda-Bold' : undefined }
            ]}
            variant="subtitle"
            lightColor={Colors.primary[700]}
            darkColor={Colors.primary[400]}
          >
            Brushing Time
          </ThemedText>
          <ThemedText style={styles.timeText}>
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds} minutes
          </ThemedText>
        </View>
      </View>
      <View style={[styles.separator, { 
        borderBottomColor: theme.colorScheme === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)' 
      }]} />
    </View>
  );
  
  const renderBrushingTimeItem = ({ item }: { item: BrushingTimeItem }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.menuItem,
        {
          backgroundColor: pressed 
            ? theme.colorScheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)'
            : 'transparent'
        }
      ]}
      onPress={() => handleBrushingTimeItemPress(item)}
    >
      <View style={[styles.iconContainer, {
        backgroundColor: theme.colorScheme === 'dark' 
          ? 'rgba(233, 196, 106, 0.2)' 
          : 'rgba(233, 196, 106, 0.1)'
      }]}>
        <MaterialCommunityIcons 
          name={item.icon} 
          size={24} 
          color={Colors.primary[500]} 
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
  
  // If not visible and animation is complete, don't render anything
  if (!isVisible && !animationComplete) return null;
  
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
              // Enhanced shadow
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 20,
              borderWidth: 0,
              overflow: 'hidden',
            }
          ]}
        >
          <BlurView
            intensity={70}
            tint={theme.colorScheme}
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: theme.colorScheme === 'dark'
                  ? 'rgba(30, 40, 60, 0.7)' 
                  : 'rgba(255, 255, 255, 0.7)',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colorScheme === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                borderRadius: 28,
              }
            ]}
          />
          
          {/* BrushingTime Items List */}
          <FlatList
            data={BRUSHING_TIME_ITEMS}
            renderItem={renderBrushingTimeItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={BrushingTimeHeader}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  iconBackdrop: {
    width: 90,
    height: 90,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: 'transparent',
  },
  timeDonut: {
    margin: 0,
  },
  headerTextContainer: {
    flex: 1,
  },
  brushingTimeTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 16,
    opacity: 0.8,
  },
  targetText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
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
  },
  separator: {
    borderBottomWidth: 1,
    marginHorizontal: 8,
    marginBottom: 16,
  },
});

export default BrushingTimeOverlay; 