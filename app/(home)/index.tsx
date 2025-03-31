import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import ThemedView from '../../components/ThemedView';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import ThemeToggle from '../../components/ThemeToggle';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { spacing } = theme;
  
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
          <ThemedText variant="title" useDisplayFont weight="medium">Hello!</ThemedText>
          <ThemeToggle compact />
        </View>
        
        <View style={{ height: spacing.md }} />
        
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
}); 