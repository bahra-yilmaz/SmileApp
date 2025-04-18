import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import Mascot from '../ui/Mascot';
import ThemedText from '../ThemedText';
import { useTypingEffect } from '../../utils/hooks/useTypingEffect';
import { useTheme } from '../ThemeProvider';

// Use the same variant types as the Mascot component
type MascotVariant = 'waving' | 'glasses' | 'brushing' | 'welcoming' | 'glasses-1-pp';

interface ExpandableMascotCardProps {
  mascotVariant: MascotVariant;
  mascotPosition: {
    translateX: number;
    translateY: number;
    scale: number;
  };
  greetingText?: string;
}

const ExpandableMascotCard: React.FC<ExpandableMascotCardProps> = ({
  mascotVariant,
  mascotPosition,
  greetingText = "Hello World!",
}) => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { borderRadius } = theme;
  
  // Track expanded state
  const [isExpanded, setIsExpanded] = useState(false);
  
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
  const [animationValues] = useState(() => ({
    width: new Animated.Value(1),
    mascotPosition: new Animated.Value(0),
    cornerRadius: new Animated.Value(1),
    notExpandedMascotOpacity: new Animated.Value(1), // Regular glasses mascot visible initially
    expandedMascotOpacity: new Animated.Value(0)     // PP glasses mascot hidden initially
  }));
  
  const { 
    width: widthAnim, 
    mascotPosition: mascotPositionAnim,
    cornerRadius: cornerRadiusAnim,
    notExpandedMascotOpacity: notExpandedMascotOpacityAnim,
    expandedMascotOpacity: expandedMascotOpacityAnim
  } = animationValues;
  
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
  
  // Handle card press to expand (one-way only)
  const handlePress = () => {
    if (!isExpanded) {
      // Expand the card and switch mascot variants
      Animated.parallel([
        // Expand the card width
        Animated.spring(widthAnim, {
          toValue: expandedWidth / circleSize,
          useNativeDriver: false,
          friction: 8,
        }),
        // Move the mascot position
        Animated.spring(mascotPositionAnim, {
          toValue: -((expandedWidth - circleSize) / 2) * 0.3,
          useNativeDriver: true,
          friction: 8,
        }),
        // Change the corner radius
        Animated.spring(cornerRadiusAnim, {
          toValue: 2,
          useNativeDriver: false,
          friction: 8,
        }),
        // Fade out regular glasses mascot
        Animated.timing(notExpandedMascotOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        // Fade in the expanded state mascot (pp version)
        Animated.timing(expandedMascotOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      setIsExpanded(true);
    }
  };
  
  return (
    <View style={styles.cardContainer}>
      <View 
        style={{
          marginTop: 80 + insets.top,
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={handlePress}
          disabled={isExpanded} // Disable press once expanded
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
              width: isExpanded ? animatedWidth : circleHeight, // Force width to match height when not expanded
              borderRadius: animatedRadius,
            }}
            style={{
              height: circleHeight,
              width: isExpanded ? animatedWidth : circleHeight, // Force width to match height when not expanded
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
                marginLeft: isExpanded ? 8 : 12, // Reduce left margin when not expanded
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
                  // Apply variant-specific positioning
                  transform: [
                    { translateX: mascotPosition.translateX },
                    { translateY: mascotPosition.translateY },
                    { scale: mascotPosition.scale }
                  ]
                }}
              >
                <Mascot 
                  variant={mascotVariant} 
                  size={nonExpandedMascotSize} // Use larger size for non-expanded state
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
                  transform: [{ translateX: 15 }], // Move the expanded mascot slightly to the right
                }}
              >
                <Mascot 
                  variant="glasses-1-pp" 
                  size={mascotSize} // Keep original size for expanded state
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
                    fontWeight: '500', // Add slight emphasis
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
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5, // Keep this below other elements
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