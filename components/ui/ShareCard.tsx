import React from 'react';
import { View, StyleSheet, Image, Dimensions } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { Colors } from '../../constants/Colors';
import ThemedText from '../ThemedText';

interface ShareCardProps {
  type: 'streak' | 'brushingTime';
  streakDays?: number;
  minutes?: number;
  seconds?: number;
}

/**
 * Renders a static card sized for social sharing (portrait phone aspect).
 * It is meant to be rendered off-screen and captured with react-native-view-shot.
 */
const ShareCard: React.FC<ShareCardProps> = ({ type, streakDays = 0, minutes = 0, seconds = 0 }) => {
  const { theme } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');

  // 3:4 aspect ratio for Instagram story / WhatsApp share
  const CARD_WIDTH = 1080; // px for crisp capture
  const CARD_HEIGHT = 1920;

  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View
      style={[
        styles.card,
        {
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          backgroundColor:
            theme.colorScheme === 'dark' ? 'rgba(24,28,40,0.85)' : 'rgba(250,250,255,0.85)',
        },
      ]}
    >
      {/* Gradient mesh background image – optional */}
      <Image
        source={require('../../assets/images/meshgradient-light-default.png')}
        style={StyleSheet.absoluteFillObject}
        blurRadius={25}
      />

      {/* Mascot */}
      <Image
        source={require('../../assets/mascot/nubo-welcoming-1.png')}
        style={styles.mascot}
        resizeMode="contain"
      />

      {/* Metric */}
      <ThemedText style={styles.metricLabel} variant="title">
        {type === 'streak' ? `${streakDays}-Day Streak` : 'Brushing Time'}
      </ThemedText>
      <ThemedText style={styles.metricValue} variant="title">
        {type === 'streak' ? '🔥' : '⏱'}{' '}
        {type === 'streak' ? `${streakDays}` : formattedTime}
      </ThemedText>

      {/* Footer */}
      <ThemedText style={styles.footer}>Made with SmileApp 🦷✨</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 60,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 80,
  },
  mascot: {
    width: '40%',
    height: '30%',
    marginBottom: 40,
  },
  metricLabel: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Merienda-Bold',
    color: Colors.primary[600],
  },
  metricValue: {
    fontSize: 200,
    textAlign: 'center',
    fontFamily: 'Merienda-Bold',
    color: Colors.primary[700],
  },
  footer: {
    position: 'absolute',
    bottom: 80,
    fontSize: 48,
    fontFamily: 'Quicksand-Medium',
    color: '#666',
  },
});

export default ShareCard; 