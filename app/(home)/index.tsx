import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Animated, Pressable } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import ThemeToggle from '../../components/ThemeToggle';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const [devOptionPressCount, setDevOptionPressCount] = useState(0);
  const router = useRouter();
  
  useEffect(() => {
    // Check if this is the first time after completing onboarding
    const checkOnboardingStatus = async () => {
      const hasCompletedOnboarding = await OnboardingService.hasCompletedOnboarding();
      if (hasCompletedOnboarding) {
        setShowWelcomeBanner(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
        
        // Hide banner after 5 seconds
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }).start(() => setShowWelcomeBanner(false));
        }, 5000);
      }
    };
    
    checkOnboardingStatus();
  }, []);
  
  // Secret developer function to reset onboarding
  const handleTitlePress = () => {
    setDevOptionPressCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 7) {
        // Reset onboarding and redirect to landing page
        OnboardingService.resetOnboardingStatus().then(() => {
          router.replace('/');
        });
        return 0;
      }
      return newCount;
    });
  };
  
  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image 
        source={require('../../assets/images/background-light-default.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg }}
      >
        <View style={styles.header}>
          <Pressable onPress={handleTitlePress}>
            <ThemedText variant="title" useDisplayFont weight="medium">Hello!</ThemedText>
          </Pressable>
          <View style={styles.headerRight}>
            <Pressable 
              style={styles.settingsButton} 
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color={activeColors.tint} />
            </Pressable>
            <ThemeToggle compact />
          </View>
        </View>
        
        <View style={{ height: spacing.md }} />
        
        {showWelcomeBanner && (
          <Animated.View style={{ opacity: fadeAnim, marginBottom: spacing.md }}>
            <GlassmorphicCard style={styles.onboardingCompleteCard}>
              <ThemedText variant="body" style={styles.onboardingCompleteText}>
                🎉 You've completed onboarding! Welcome to your Smile App experience.
              </ThemedText>
            </GlassmorphicCard>
          </Animated.View>
        )}
        
        <GlassmorphicCard style={styles.welcomeCard}>
          <ThemedText variant="subtitle" style={styles.welcomeTitle} useDisplayFont>
            Welcome to Smile App
          </ThemedText>
          <ThemedText variant="body" style={styles.welcomeText}>
            This is your new app with a beautiful theme system that supports
            light and dark modes, as well as custom color themes.
          </ThemedText>
        </GlassmorphicCard>
        
        <View style={{ height: spacing.lg }} />
        
        <ThemedText variant="subtitle" useDisplayFont style={{ marginBottom: spacing.sm }}>
          Features
        </ThemedText>
        
        <View style={styles.featuresContainer}>
          <ThemedView variant="card" style={styles.featureCard}>
            <ThemedText variant="body" weight="bold" style={styles.featureTitle}>
              Glassmorphism
            </ThemedText>
            <ThemedText variant="body">
              Beautiful glass effects with blur and transparency
            </ThemedText>
          </ThemedView>
          
          <ThemedView variant="card" style={styles.featureCard}>
            <ThemedText variant="body" weight="bold" style={styles.featureTitle}>
              Theming
            </ThemedText>
            <ThemedText variant="body">
              Light/dark mode support and custom color themes
            </ThemedText>
          </ThemedView>
          
          <ThemedView variant="card" style={styles.featureCard}>
            <ThemedText variant="body" weight="bold" style={styles.featureTitle}>
              Typography
            </ThemedText>
            <ThemedText variant="body">
              Consistent text styles with Merienda and Quicksand fonts
            </ThemedText>
          </ThemedView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsButton: {
    marginRight: 10,
  },
  welcomeCard: {
    padding: 20,
  },
  welcomeTitle: {
    marginBottom: 10,
  },
  welcomeText: {
    opacity: 0.8,
  },
  featuresContainer: {
    gap: 16,
  },
  featureCard: {
    padding: 16,
  },
  featureTitle: {
    marginBottom: 8,
  },
  onboardingCompleteCard: {
    padding: 20,
  },
  onboardingCompleteText: {
    opacity: 0.8,
  },
}); 