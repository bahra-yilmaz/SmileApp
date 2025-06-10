import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

interface GlassmorphicHeaderProps {
  title: string;
  onBackPress?: () => void;
  showBackButton?: boolean;
  rightElement?: React.ReactNode;
  intensity?: number;
  style?: any;
  titleStyle?: any;
  textColor?: string;
  scrollY?: Animated.SharedValue<number>;
  fadeThreshold?: number;
}

export default function GlassmorphicHeader({
  title,
  onBackPress,
  showBackButton = true,
  rightElement,
  intensity = 65,
  style,
  titleStyle,
  textColor,
  scrollY,
  fadeThreshold = 30,
}: GlassmorphicHeaderProps) {
  const { theme } = useTheme();
  const { activeColors } = theme;
  const insets = useSafeAreaInsets();

  const finalTextColor = textColor || 'white';

  const animatedStyle = useAnimatedStyle(() => {
    if (!scrollY) return { opacity: 1 };
    
    const progress = Math.min(Math.max(scrollY.value / fadeThreshold, 0), 1);
    return { 
      backgroundColor: `rgba(255, 255, 255, ${progress * 0.08})`,
    };
  });

  const animatedBlurIntensity = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const progress = Math.min(Math.max(scrollY.value / fadeThreshold, 0), 1);
    return {
      opacity: progress,
    };
  });

  const animatedTextShadow = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const progress = Math.min(Math.max(scrollY.value / fadeThreshold, 0), 1);
    const shadowOpacity = progress * 0.4;
    const shadowRadius = progress * 4;
    
    return {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 * progress },
      shadowOpacity: shadowOpacity,
      shadowRadius: shadowRadius,
      elevation: progress * 2,
    };
  });

  const animatedIconShadow = useAnimatedStyle(() => {
    if (!scrollY) return {};
    
    const progress = Math.min(Math.max(scrollY.value / fadeThreshold, 0), 1);
    const shadowOpacity = progress * 0.3;
    
    return {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 * progress },
      shadowOpacity: shadowOpacity,
      shadowRadius: 2 * progress,
      elevation: progress * 4,
    };
  });

  return (
    <Animated.View style={[styles.header, { height: 75 + insets.top }, style]}>
      <View style={styles.headerContainer}>
        <Animated.View style={[styles.blurContainer, animatedBlurIntensity]}>
          <BlurView 
            intensity={intensity}
            style={styles.headerBlur}
          />
        </Animated.View>
        
        <Animated.View style={[styles.backgroundOverlay, animatedStyle]} />
        
        <View style={styles.headerWrapper}>
          {/* Safe area spacer */}
          <View style={{ height: insets.top }} />
          
          {/* Actual header content */}
          <View style={styles.headerContent}>
            {showBackButton ? (
              <Animated.View style={[styles.backButton, animatedIconShadow]}>
                <Pressable onPress={onBackPress} style={styles.backButtonInner}>
                  <Ionicons name="chevron-back" size={28} color={finalTextColor} />
                </Pressable>
              </Animated.View>
            ) : (
              <View style={styles.backButton} />
            )}
            
            <Animated.Text style={[
              styles.headerText, 
              { color: finalTextColor }, 
              titleStyle,
              animatedTextShadow
            ]}>
              {title}
            </Animated.Text>
            
            {rightElement ? (
              <Animated.View style={[styles.rightElement, animatedIconShadow]}>
                {rightElement}
              </Animated.View>
            ) : (
              <View style={styles.backButton} />
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 10,
    paddingHorizontal: 0,
  },
  headerBlur: {
    flex: 1,
    borderRadius: 0,
    marginHorizontal: 0,
    justifyContent: 'flex-start',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 75,
    paddingHorizontal: 16,
  },
  headerText: {
    fontSize: 32,
    letterSpacing: 1.6,
    textAlign: 'center',
    fontFamily: 'Merienda-Medium',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightElement: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flex: 1,
    position: 'relative',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  headerWrapper: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
}); 