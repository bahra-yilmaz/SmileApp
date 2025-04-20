import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Pressable, ImageSourcePropType, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import GlassmorphicCard from '../ui/GlassmorphicCard';
import { OnboardingService } from '../../services/OnboardingService';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  title: string;
  description: string;
  imageSource?: ImageSourcePropType;
  nextScreenPath: string;
  isLastScreen?: boolean;
  index: number;
  totalScreens: number;
  hideImage?: boolean;
}

export default function OnboardingScreen({
  title,
  description,
  imageSource,
  nextScreenPath,
  isLastScreen = false,
  index,
  totalScreens,
  hideImage = false,
}: OnboardingScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Run animations when the component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  const handleSkip = () => {
    // Mark onboarding as completed and navigate to main app
    OnboardingService.markOnboardingAsCompleted().then(() => {
      router.push('/(home)' as any);
    });
  };

  const handleNext = async () => {
    if (isLastScreen) {
      // If this is the last screen, mark onboarding as completed
      await OnboardingService.markOnboardingAsCompleted();
    }
    router.push(nextScreenPath as any);
  };

  return (
    <View style={styles.container}>
      {/* Content */}
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Image - conditionally rendered */}
        {!hideImage && imageSource && (
          <View style={styles.imageContainer}>
            <Image 
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}
        
        {/* Main Content */}
        <GlassmorphicCard style={[styles.card, hideImage && styles.cardWithoutImage]}>
          <ThemedText 
            variant="title" 
            style={styles.title}
            useDisplayFont
            weight="medium"
          >
            {title}
          </ThemedText>
          
          <ThemedText 
            variant="body" 
            style={styles.description}
          >
            {description}
          </ThemedText>
          
          {/* Progress indicators */}
          <View style={styles.indicators}>
            {Array(totalScreens).fill(0).map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.indicator,
                  { 
                    backgroundColor: i === index 
                      ? theme.colors.primary[500] 
                      : theme.colors.neutral[300],
                    width: i === index ? 24 : 8
                  }
                ]}
              />
            ))}
          </View>
          
          {/* Action buttons */}
          <View style={styles.buttonsContainer}>
            {!isLastScreen && (
              <Pressable onPress={handleSkip} style={styles.skipButton}>
                <ThemedText style={styles.skipText}>Skip</ThemedText>
              </Pressable>
            )}
            
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <ThemedText style={styles.nextText}>
                {isLastScreen ? 'Get Started' : 'Next'}
              </ThemedText>
            </Pressable>
          </View>
        </GlassmorphicCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: width * 0.9,
    height: height * 0.8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '100%',
    height: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  image: {
    width: '80%',
    height: '80%',
  },
  card: {
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderRadius: 24,
  },
  cardWithoutImage: {
    marginTop: 100, // Add more space on top when no image
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.8,
    lineHeight: 24,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    height: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    opacity: 0.7,
  },
  nextButton: {
    backgroundColor: '#0095E6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 