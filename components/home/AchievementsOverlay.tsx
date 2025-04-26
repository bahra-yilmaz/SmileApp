import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { useFonts } from 'expo-font';
import ThemedText from '../ThemedText';

interface AchievementsOverlayProps {
  // We'll add needed props as they're defined
}

const AchievementsOverlay: React.FC<AchievementsOverlayProps> = () => {
  const { theme } = useTheme();
  const [fontsLoaded] = useFonts({
    'Merienda-Regular': require('../../assets/fonts/Merienda-Regular.ttf'),
  });
  
  // Mock data - in a real app this would come from state/props
  const unlockedCount = 4;
  const totalAchievements = 10;

  return (
    <View style={styles.container}>
      {/* Achievements Header with blur effect */}
      <BlurView
        intensity={70}
        tint={theme.colorScheme}
        style={[
          styles.menuHeader,
          { 
            borderBottomColor: theme.colorScheme === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            backgroundColor: theme.colorScheme === 'dark'
              ? 'rgba(30, 40, 60, 0.7)' 
              : 'rgba(255, 255, 255, 0.7)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            zIndex: 10,
          }
        ]}
      >
        <ThemedText 
          style={[
            styles.headerTitle,
            { 
              fontFamily: fontsLoaded ? 'Merienda-Regular' : undefined,
            }
          ]}
          variant="title"
          lightColor={theme.colors.primary[500]}
          darkColor={theme.colors.primary[400]}
        >
          Achievements
        </ThemedText>
        <ThemedText style={styles.headerSubtitle} variant="caption">
          {unlockedCount} of {totalAchievements} unlocked
        </ThemedText>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuHeader: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
});

export default AchievementsOverlay; 