import React from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, Alert } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors, colors } = theme;
  const router = useRouter();
  
  const handleResetOnboarding = () => {
    Alert.alert(
      "Reset Onboarding",
      "Are you sure you want to reset the onboarding flow? You'll be redirected to the welcome screen.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset",
          onPress: async () => {
            await OnboardingService.resetOnboardingStatus();
            router.replace('/');
          },
          style: "destructive"
        }
      ]
    );
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
          <ThemedText variant="title" useDisplayFont weight="medium">Settings</ThemedText>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={activeColors.tint} />
          </Pressable>
        </View>
        
        <View style={{ height: spacing.lg }} />
        
        <GlassmorphicCard style={styles.settingsCard}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>App Settings</ThemedText>
          
          <Pressable 
            style={styles.settingItem}
            onPress={handleResetOnboarding}
          >
            <View style={styles.settingContent}>
              <Ionicons name="refresh-circle-outline" size={24} color={activeColors.tint} />
              <ThemedText style={styles.settingText}>Reset Onboarding</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="moon-outline" size={24} color={activeColors.tint} />
              <ThemedText style={styles.settingText}>App Theme</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
          </Pressable>
          
          <View style={styles.divider} />
          
          <Pressable style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="language-outline" size={24} color={activeColors.tint} />
              <ThemedText style={styles.settingText}>Language</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={activeColors.textSecondary} />
          </Pressable>
        </GlassmorphicCard>
        
        <View style={{ height: spacing.md }} />
        
        <GlassmorphicCard style={styles.settingsCard}>
          <ThemedText variant="subtitle" style={styles.sectionTitle}>About</ThemedText>
          
          <Pressable style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name="information-circle-outline" size={24} color={activeColors.tint} />
              <ThemedText style={styles.settingText}>App Version</ThemedText>
            </View>
            <ThemedText style={styles.versionText}>1.0.0</ThemedText>
          </Pressable>
        </GlassmorphicCard>
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
  backButton: {
    padding: 8,
  },
  settingsCard: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
  },
  versionText: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
  },
}); 