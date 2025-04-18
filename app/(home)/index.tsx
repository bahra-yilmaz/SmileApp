import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Pressable, Animated, Text, Image } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import Mascot from '../../components/ui/Mascot';
import ThemedText from '../../components/ThemedText';
import StatCard from '../../components/ui/StatCard';
import DonutChart from '../../components/ui/DonutChart';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { spacing, borderRadius } = theme;
  const insets = useSafeAreaInsets();
  
  // Full text to be typed
  const fullText = "Hello World!";
  // For the typing effect
  const [typedText, setTypedText] = useState("");
  const typingInterval = useRef<NodeJS.Timeout | null>(null);
  
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
  // Reduced circle height (85% of original size)
  const circleHeight = circleSize * 0.85;
  // Calculate mascot size (slightly smaller than the circle)
  const mascotSize = circleHeight * 0.8;
  // Calculate expanded width (55% of screen width)
  const expandedWidth = screenWidth * 0.57;
  
  // Get theme border radius
  const pillRadius = circleSize / 2;
  const cardRadius = borderRadius.md;
  
  // Calculate animated values safely
  const [animatedWidth, setAnimatedWidth] = useState(circleSize);
  const [animatedRadius, setAnimatedRadius] = useState(pillRadius);
  
  // Calculate the height for the right card (from top of first card to bottom of second card)
  const rightCardHeight = 228; // Approximate height to span both left cards
  
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
  
  // Typing effect for the text
  useEffect(() => {
    if (isExpanded) {
      // Reset text first
      setTypedText("");
      
      // Start typing after a shorter delay for a more immediate effect
      const startTypingTimeout = setTimeout(() => {
        let charIndex = 0;
        
        // Clear any existing interval
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
        }
        
        // Set up typing interval with faster speed
        typingInterval.current = setInterval(() => {
          if (charIndex < fullText.length) {
            setTypedText(fullText.substring(0, charIndex + 1));
            charIndex++;
          } else {
            // Clear interval once typing is complete
            if (typingInterval.current) {
              clearInterval(typingInterval.current);
              typingInterval.current = null;
            }
          }
        }, 50); // Faster typing speed (was 100)
      }, 400); // Shorter delay before typing starts (was 600)
      
      return () => {
        clearTimeout(startTypingTimeout);
        if (typingInterval.current) {
          clearInterval(typingInterval.current);
          typingInterval.current = null;
        }
      };
    }
  }, [isExpanded, fullText]);
  
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
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
  });
  
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
                  height: circleHeight,
                  borderRadius: animatedRadius,
                }}
                style={{
                  height: circleHeight,
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
                    height: circleHeight,
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
            zIndex: 25, // Keep it consistently above other elements
          }}
        >
          {/* Streak Days Card - Updated from Avg. Brushings Per Day */}
          <StatCard
            title=""
            value={
              <View style={styles.streakValueContainer}>
                <View style={styles.flameContainer}>
                  <MaterialCommunityIcons 
                    name="fire" 
                    size={42} 
                    color={Colors.primary[500]} 
                    style={styles.flameIcon}
                  />
                </View>
                <ThemedText 
                  variant="title" 
                  style={[
                    styles.streakValue,
                    fontsLoaded && { fontFamily: 'Merienda-Bold' }
                  ]}
                >
                  7
                </ThemedText>
                <ThemedText 
                  variant="caption" 
                  style={styles.streakText}
                >
                  days streak
                </ThemedText>
              </View>
            }
            maxValue=""
            progress={0}
            progressLabels={[]}
            containerStyle={styles.brushingsPerDayContainer}
            contentStyle={styles.streakCardContent}
          />
          
          {/* Average Brushing Time Card - Now positioned second/bottom */}
          <StatCard
            title=""
            value={
              <View style={styles.brushingTimeValueContainer}>
                <View style={styles.brushingTimeDonutContainer}>
                  <DonutChart
                    progress={(2.5 / 3) * 100}
                    size={38}
                    thickness={6}
                    progressColor={Colors.primary[200]}
                    style={styles.brushingTimeDonut}
                  />
                </View>
                <ThemedText 
                  variant="title" 
                  style={[
                    styles.brushingTimeValue,
                    fontsLoaded && { fontFamily: 'Merienda-Bold' }
                  ]}
                >
                  2
                  <ThemedText
                    style={[
                      styles.brushingTimeSeconds,
                      fontsLoaded && { fontFamily: 'Merienda-Bold' }
                    ]}
                  >
                    :30
                  </ThemedText>
                </ThemedText>
                <ThemedText 
                  variant="caption" 
                  style={styles.brushingTimeText}
                >
                  minutes
                </ThemedText>
              </View>
            }
            maxValue=""
            progress={0}
            progressLabels={[]}
            containerStyle={styles.brushingTimeContainer}
            contentStyle={styles.brushingTimeCardContent}
            cardStyle={styles.brushingTimeCardStyle}
            height={74}
          />
          
          {/* Right Side Card (Toothbrush Card) */}
          <StatCard
            title=""
            value={
              <View style={styles.toothbrushContentContainer}>
                <Image 
                  source={require('../../assets/images/toothbrush.png')}
                  style={styles.toothbrushImage}
                  resizeMode="contain"
                />
              </View>
            }
            maxValue=""
            progress={0}
            progressLabels={[]}
            height={165}
            containerStyle={styles.toothbrushCardContainer}
            contentStyle={styles.toothbrushCardContent}
            cardStyle={styles.toothbrushCardStyle}
          />
          
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
    zIndex: 5, // Keep this below other elements
  },
  expandedContent: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingLeft: 10,
    alignItems: 'flex-start',
    alignSelf: 'center',
  },
  brushingsPerDayContainer: {
    top: -35, // Position from top of the Light Container
    left: 20,
    zIndex: 30, // Ensure it stays above other elements
  },
  brushingTimeContainer: {
    top: 55, 
    left: 20,
    zIndex: 30, // Ensure it stays above other elements
  },
  toothbrushCardContainer: {
    top: -35, // Match the top position of the first card
    right: 20, // Positioned on the right side
    zIndex: 30, // Ensure it stays above other elements
  },
  toothbrushCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: '100%',
  },
  toothbrushCardStyle: {
    padding: 2,
  },
  streakValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
    height: '100%',
    paddingLeft: 0,
  },
  streakValue: {
    fontSize: 34,
    fontWeight: '700',
    marginLeft: 2,
    marginRight: 2,
    color: Colors.primary[800],
  },
  streakText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    alignSelf: 'center',
    paddingTop: 4,
    color: Colors.primary[800],
  },
  streakCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
    paddingTop: 2,
  },
  flameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -2,
  },
  flameIcon: {
    marginBottom: 8,
    color: Colors.primary[200],
  },
  brushingTimeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
    height: '100%',
    paddingLeft: 0,
  },
  brushingTimeDonutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -2,
  },
  brushingTimeDonut: {
    marginBottom: 8,
  },
  brushingTimeValue: {
    fontSize: 34,
    fontWeight: '700',
    marginLeft: 2,
    marginRight: 2,
    color: Colors.primary[800],
  },
  brushingTimeSeconds: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[800],
    opacity: 0.9,
  },
  brushingTimeText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    alignSelf: 'center',
    paddingTop: 4,
    color: Colors.primary[800],
  },
  brushingTimeCardStyle: {
    padding: 0,
  },
  brushingTimeCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: -6, // Move content 8px above
  },
  toothbrushContentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  toothbrushImage: {
    width: Dimensions.get('window').width * 0.32,
    height: 150,
    position: 'absolute',
    right: -25,
    top: '50%',
    transform: [
      { translateY: -75 },
      { scale: 1.1 }
    ],
  },
}); 