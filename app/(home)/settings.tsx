import React from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Text, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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
      <View style={[styles.header, { top: insets.top, paddingHorizontal: spacing.md }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={activeColors.text} />
        </Pressable>
        <Text style={styles.headerText}>settings</Text>
        <View style={styles.backButton} />
      </View>
      
      <ScrollView 
        style={{ flex: 1, marginTop: 60 + insets.top }}
        contentContainerStyle={{ 
          paddingTop: spacing.lg,
          paddingBottom: spacing.lg,
          alignItems: 'center'
        }}
      >
        <GlassmorphicCard style={styles.settingsCard} width={screenWidth * 0.9}>
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
        
        <GlassmorphicCard style={styles.settingsCard} width={screenWidth * 0.9}>
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
  header: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
  },
  headerText: {
    fontSize: 32,
    color: 'white',
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
  settingsCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontFamily: 'Quicksand-Bold',
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