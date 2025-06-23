import React from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatCard from '../ui/StatCard';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';
import { useTranslation } from 'react-i18next';
import { useStreak } from '../../context/StreakContext';

interface StreakCardProps {
  streakDays?: number; // Make optional - will use context if not provided
  fontFamily?: string;
  onPress?: () => void;
}

const StreakCard: React.FC<StreakCardProps> = ({
  streakDays: propStreakDays,
  fontFamily,
  onPress,
}) => {
  const { t } = useTranslation();
  const { currentStreak } = useStreak();
  
  // Use prop value if provided, otherwise use context value
  const streakDays = propStreakDays ?? currentStreak;

  return (
    <Pressable 
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressableContainer,
        pressed && styles.pressed
      ]}
    >
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
              fontFamily && { fontFamily }
            ]}
          >
            {streakDays}
          </ThemedText>
          <ThemedText 
            variant="caption" 
            style={styles.streakText}
          >
            {t('homeScreen.streakCard.daysStreak')}
          </ThemedText>
        </View>
      }
      maxValue=""
      progress={0}
      progressLabels={[]}
      containerStyle={styles.fixedStreakCardContainer}
      contentStyle={styles.streakCardContent}
      cardStyle={styles.streakCardStyle}
      height={74}
      width={Dimensions.get('window').width * 0.42}
    />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    position: 'absolute',
    top: -35,
    left: 20,
    zIndex: 30,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    height: '100%',
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
  fixedStreakCardContainer: {
    position: 'relative',
    zIndex: 30, // Ensure it stays above other elements
    width: Dimensions.get('window').width * 0.42,
  },
  streakCardStyle: {
    padding: 0,
    height: 74,
  },
});

export default StreakCard; 