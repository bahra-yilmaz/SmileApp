import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import ThemedText from '../components/ThemedText';
import ThemedView from '../components/ThemedView';
import { useTheme } from '../components/ThemeProvider';
import GlassmorphicCard from '../components/ui/GlassmorphicCard';
import { OnboardingService } from '../services/OnboardingService';

const { width } = Dimensions.get('window');

export default function LandingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboardingStatus = async () => {
      const hasCompletedOnboarding = await OnboardingService.hasCompletedOnboarding();
      if (hasCompletedOnboarding) {
        // If onboarding is completed, redirect to home screen
        router.replace('/(home)');
      }
    };
    
    checkOnboardingStatus();
  }, []);
  
  const handleGetStarted = () => {
    router.push('/onboarding');
  };
  
  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <Image 
        source={require('../assets/images/meshgradient-light-default.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Content */}
      <View style={styles.content}>
        <ThemedText 
          variant="display" 
          style={styles.title}
          useDisplayFont={true}
          weight="medium"
        >
          Smile
        </ThemedText>
        
        <GlassmorphicCard style={styles.card}>
          <ThemedText variant="body" style={styles.message}>
            Your happy place for productivity and wellness
          </ThemedText>
          
          <Pressable style={styles.button} onPress={handleGetStarted}>
            <ThemedText style={styles.buttonText} weight="medium">
              Get Started
            </ThemedText>
          </Pressable>
        </GlassmorphicCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  content: {
    width: width * 0.85,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    marginBottom: 20,
    textAlign: 'center',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  card: {
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#0095E6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  }
}); 