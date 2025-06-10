import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Alert, Text, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import ThemedText from '../../components/ThemedText';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import { OnboardingService } from '../../services/OnboardingService';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AppImages } from '../../utils/loadAssets';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing,
  runOnJS,
  useAnimatedGestureHandler
} from 'react-native-reanimated';

const { width: screenWidth } = Dimensions.get('window');

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { spacing, activeColors } = theme;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const translateX = useSharedValue(screenWidth);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    // Animate in from the right
    translateX.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  }, []);
  
  const handleBackPress = () => {
    // Animate out to the right
    translateX.value = withTiming(screenWidth, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    }, () => {
      runOnJS(router.back)();
    });
    opacity.value = withTiming(0, {
      duration: 200,
      easing: Easing.in(Easing.quad),
    });
  };
  
  // Gesture handler for swipe-to-go-back
  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      // Only allow swiping to the right and only if gesture starts from left edge
      if (event.translationX > 0 && event.x < 50) {
        translateX.value = Math.max(0, event.translationX);
      }
    },
    onEnd: (event) => {
      // If user swiped more than 100 pixels to the right, trigger back navigation
      if (event.translationX > 100 && event.velocityX > 0) {
        runOnJS(handleBackPress)();
      } else {
        // Snap back to original position
        translateX.value = withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.quad),
        });
      }
    },
  });
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
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
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedStyle]}>
        <Image 
          source={require('../../assets/images/meshgradient-light-default.png')}
          style={styles.backgroundImage}
          contentFit="cover"
          cachePolicy="disk"
        />
        
        <View style={[styles.header, { top: insets.top, paddingHorizontal: spacing.md }]}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
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
      </Animated.View>
    </PanGestureHandler>
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
    left: 0,
    top: 0,
    zIndex: 0,
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