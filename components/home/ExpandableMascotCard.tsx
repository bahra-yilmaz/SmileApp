import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import Mascot from '../ui/Mascot';
import ThemedText from '../ThemedText';
import { useTypingEffect } from '../../utils/hooks/useTypingEffect';
import { useTheme } from '../ThemeProvider';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

// Use the same variant types as the Mascot component
type MascotVariant = 'waving' | 'glasses' | 'brushing' | 'welcoming' | 'glasses-1-pp';

interface ExpandableMascotCardProps {
  mascotVariant: MascotVariant;
  mascotPosition: {
    translateX: number;
    translateY: number;
    scale: number;
  };
  greetingText: string;
  isExpanded: boolean;
  onPress: () => void;
  enablePulse: boolean;
}

const ExpandableMascotCard: React.FC<ExpandableMascotCardProps> = ({
  mascotVariant,
  mascotPosition,
  greetingText,
  isExpanded,
  onPress,
  enablePulse
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { borderRadius } = theme;
  
  // Get screen dimensions
  const { width: screenWidth } = Dimensions.get('window');
  
  // Calculate circle height (85% of original size)
  const circleHeight = screenWidth * 0.2 * 0.85;
  // Using height for width to create a perfect circle in non-expanded state
  const circleSize = circleHeight;
  // Calculate mascot size (slightly smaller than the circle)
  const mascotSize = circleHeight * 0.8;
  // Slightly larger mascot size for non-expanded state
  const nonExpandedMascotSize = circleHeight * 0.9;
  // Calculate expanded width (45% of screen width)
  const expandedWidth = screenWidth * 0.52;
  
  // Get theme border radius
  const pillRadius = circleSize / 2;
  const cardRadius = borderRadius.md;
  
  // Create animation values
  const animationValuesRef = useRef({
    width: new Animated.Value(1),
    mascotPosition: new Animated.Value(0),
    cornerRadius: new Animated.Value(1),
    notExpandedMascotOpacity: new Animated.Value(1),
    expandedMascotOpacity: new Animated.Value(0)
  }).current;
  
  const { 
    width: widthAnim, 
    mascotPosition: mascotPositionAnim,
    cornerRadius: cornerRadiusAnim,
    notExpandedMascotOpacity: notExpandedMascotOpacityAnim,
    expandedMascotOpacity: expandedMascotOpacityAnim
  } = animationValuesRef;
  
  // Calculate animated values safely
  const [animatedWidth, setAnimatedWidth] = useState(circleSize);
  const [animatedRadius, setAnimatedRadius] = useState(pillRadius);
  
  // Update animated width and radius based on the animated values
  useEffect(() => {
    const widthListener = widthAnim.addListener(({ value }) => {
      const interpolatedWidth = circleSize + (value - 1) * (expandedWidth - circleSize);
      setAnimatedWidth(interpolatedWidth);
    });
    
    const radiusListener = cornerRadiusAnim.addListener(({ value }) => {
      const interpolatedRadius = pillRadius - (value - 1) * (pillRadius - cardRadius);
      setAnimatedRadius(interpolatedRadius);
    });
    
    return () => {
      widthAnim.removeListener(widthListener);
      cornerRadiusAnim.removeListener(radiusListener);
    };
  }, [widthAnim, cornerRadiusAnim, circleSize, expandedWidth, pillRadius, cardRadius]);
  
  // Get typed text using the custom hook
  const typedText = useTypingEffect({
    text: greetingText,
    enabled: isExpanded
  });
  
  // Pulse animation setup with Reanimated
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (enablePulse && !isExpanded) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
          withTiming(1, { duration: 700, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
        ),
        -1, // Infinite repeat
        true // Reverse animation
      );
    } else {
      cancelAnimation(pulseScale); // Stop animation
      pulseScale.value = withTiming(1, { duration: 200 }); // Reset scale
    }
    // Cleanup on unmount or when pulse is disabled
    return () => {
      cancelAnimation(pulseScale);
    };
  }, [enablePulse, isExpanded, pulseScale]);

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  // Handle card expansion/collapse based on isExpanded prop
  useEffect(() => {
    const animations = [
      Animated.spring(widthAnim, {
        toValue: isExpanded ? expandedWidth / circleSize : 1,
        useNativeDriver: false,
        friction: 8,
      }),
      Animated.spring(mascotPositionAnim, {
        toValue: isExpanded ? -((expandedWidth - circleSize) / 2) * 0.3 : 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.spring(cornerRadiusAnim, {
        toValue: isExpanded ? 2 : 1,
        useNativeDriver: false,
        friction: 8,
      }),
      Animated.timing(notExpandedMascotOpacityAnim, {
        toValue: isExpanded ? 0 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(expandedMascotOpacityAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      })
    ];
    Animated.parallel(animations).start();
  }, [isExpanded, widthAnim, mascotPositionAnim, cornerRadiusAnim, notExpandedMascotOpacityAnim, expandedMascotOpacityAnim, expandedWidth, circleSize]);
  
  return (
    <Reanimated.View style={pulseAnimatedStyle}>
      <View style={styles.cardContainer}>
        <View 
          style={{
            alignItems: 'center',
          }}
        >
          <Pressable
            onPress={onPress}
            disabled={isExpanded}
            style={({ pressed }) => ({
              opacity: (!isExpanded && pressed) ? 0.95 : 1 
            })}
          >
            <GlassmorphicCard
              width={animatedWidth}
              borderRadius="none"
              intensity={70}
              shadow="lg"
              containerStyle={{
                height: circleHeight,
                width: isExpanded ? animatedWidth : circleHeight,
                borderRadius: animatedRadius,
              }}
              style={{
                height: circleHeight,
                width: isExpanded ? animatedWidth : circleHeight,
                borderRadius: animatedRadius,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                flexDirection: 'row',
                paddingHorizontal: isExpanded ? 8 : 15,
              }}
            >
              {/* Nubo Mascot with fade transition */}
              <Animated.View
                style={{
                  transform: [{ translateX: mascotPositionAnim }],
                  width: mascotSize,
                  height: circleHeight,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginLeft: isExpanded ? 8 : 12,
                }}
              >
                {/* Regular Glasses Nubo (starts visible, hidden when expanded) */}
                <Animated.View 
                  style={{ 
                    opacity: notExpandedMascotOpacityAnim, 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [
                      { translateX: mascotPosition.translateX },
                      { translateY: mascotPosition.translateY },
                      { scale: mascotPosition.scale }
                    ]
                  }}
                >
                  <Mascot 
                    variant={mascotVariant} 
                    size={nonExpandedMascotSize}
                  />
                </Animated.View>
                
                {/* PP Glasses Nubo (hidden initially, shown when expanded) */}
                <Animated.View 
                  style={{ 
                    opacity: expandedMascotOpacityAnim, 
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    transform: [{ translateX: 15 }],
                  }}
                >
                  <Mascot 
                    variant="glasses-1-pp" 
                    size={mascotSize}
                  />
                </Animated.View>
              </Animated.View>
              
              {/* Content that appears on expansion */}
              {isExpanded && (
                <View style={styles.expandedContent}>
                  <ThemedText 
                    variant="subtitle" 
                    style={{ 
                      color: 'white', 
                      marginLeft: 0, 
                      fontSize: 15,
                      fontWeight: '500',
                    }}
                  >
                    {typedText}
                  </ThemedText>
                </View>
              )}
            </GlassmorphicCard>
          </Pressable>
        </View>
      </View>
    </Reanimated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 4,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
});

export default ExpandableMascotCard; 