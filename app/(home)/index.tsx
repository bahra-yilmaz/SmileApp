import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Animated } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import Mascot from '../../components/ui/Mascot';
import ThemedText from '../../components/ThemedText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { spacing, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  
  // Create animation values
  const [animationValues] = useState(() => ({
    width: new Animated.Value(1),
    mascotPosition: new Animated.Value(0),
    cornerRadius: new Animated.Value(1),
    wavingOpacity: new Animated.Value(1),
    glassesOpacity: new Animated.Value(0)
  }));
  const { 
    width: widthAnim, 
    mascotPosition: mascotPositionAnim,
    cornerRadius: cornerRadiusAnim,
    wavingOpacity: wavingOpacityAnim,
    glassesOpacity: glassesOpacityAnim
  } = animationValues;
  
  // Track expanded state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get screen dimensions
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  // Calculate container height
  const containerHeight = screenHeight * 0.65;
  // Calculate circle size (20% of screen width)
  const circleSize = screenWidth * 0.2;
  // Calculate mascot size (slightly smaller than the circle)
  const mascotSize = circleSize * 0.8;
  // Calculate expanded width (55% of screen width)
  const expandedWidth = screenWidth * 0.55;
  
  // Get theme border radius
  const pillRadius = circleSize / 2;
  const cardRadius = borderRadius.md;
  
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
  
  // Handle card press to expand (one-way only)
  const handlePress = () => {
    if (!isExpanded) {
      // Expand the card - no option to collapse back
      Animated.parallel([
        Animated.spring(widthAnim, {
          toValue: expandedWidth / circleSize,
          useNativeDriver: false,
          friction: 8,
        }),
        Animated.spring(mascotPositionAnim, {
          toValue: -((expandedWidth - circleSize) / 2) * 0.3,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.spring(cornerRadiusAnim, {
          toValue: 2,
          useNativeDriver: false,
          friction: 8,
        }),
        // Fade out waving mascot
        Animated.timing(wavingOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        // Fade in glasses mascot
        Animated.timing(glassesOpacityAnim, {
          toValue: 1,
          duration: 300,
          delay: 150, // Small delay for a better transition
          useNativeDriver: true,
        })
      ]).start();
      
      setIsExpanded(true);
    }
    // No else clause - we don't allow collapsing back
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Smile Header in safe area */}
        <SafeAreaView style={styles.headerContainer}>
          <HeaderLogo />
        </SafeAreaView>
        
        {/* Expandable Circular Glassmorphic Card */}
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
                  height: circleSize,
                  borderRadius: animatedRadius,
                }}
                style={{
                  height: circleSize,
                  borderRadius: animatedRadius,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  flexDirection: 'row',
                  paddingHorizontal: 15,
                }}
              >
                {/* Nubo Mascot with fade transition */}
                <Animated.View
                  style={{
                    transform: [{ translateX: mascotPositionAnim }],
                    width: mascotSize,
                    height: circleSize,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    marginLeft: 14,
                  }}
                >
                  {/* Waving Nubo (fades out) */}
                  <Animated.View 
                    style={{ 
                      opacity: wavingOpacityAnim, 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Mascot 
                      variant="waving" 
                      size={mascotSize}
                    />
                  </Animated.View>
                  
                  {/* Glasses Nubo (fades in) */}
                  <Animated.View 
                    style={{ 
                      opacity: glassesOpacityAnim, 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      justifyContent: 'center',
                      alignItems: 'center',
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
                        marginLeft: -15,
                        fontSize: 15,
                      }}
                    >
                      Hello World!
                    </ThemedText>
                  </View>
                )}
              </GlassmorphicCard>
            </Pressable>
          </View>
        </View>
        
        {/* Light Container positioned at the absolute bottom with fixed height */}
        <LightContainer 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: containerHeight,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
            flex: 0,
          }}
        >
          {/* Content for the light container will go here */}
        </LightContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  headerContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  cardContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 10,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
}); 