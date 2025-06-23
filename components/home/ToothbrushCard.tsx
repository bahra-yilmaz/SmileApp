import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import StatCard from '../ui/StatCard';
import ThemedText from '../ThemedText';
import { useTranslation } from 'react-i18next';
import { Colors } from '../../constants/Colors';
import { useToothbrushStats } from '../../hooks/useToothbrushStats';
import { useAuth } from '../../context/AuthContext';

interface ToothbrushCardProps {
  fontFamily?: string;
  onPress?: () => void;
}

const ToothbrushCard: React.FC<ToothbrushCardProps> = ({
  fontFamily,
  onPress,
}) => {
  const { t } = useTranslation();
  const { stats, simpleDaysInUse, isLoading, refreshStats } = useToothbrushStats();
  const { user } = useAuth();
  
  // For the card, show calendar days (toothbrush age) as it's more intuitive for users
  // The detailed stats with actual brushing days are shown in the overlay
  const displayDays = stats?.totalCalendarDays ?? simpleDaysInUse;
  const replacementText = stats?.replacementText ?? t('homeScreen.toothbrushCard.replaceSoon');
  
  // Force refresh when user changes to ensure we have the right data
  useEffect(() => {
    if (user?.id && displayDays === 0 && !isLoading) {
      console.log('🦷 ToothbrushCard: User authenticated but showing 0 days, debugging...');
      console.log('🦷 Current stats:', stats);
      console.log('🦷 Simple days in use:', simpleDaysInUse);
      console.log('🦷 User ID:', user.id);
      
      // Force a complete refresh
      setTimeout(() => {
        console.log('🦷 Forcing toothbrush stats refresh...');
        refreshStats();
      }, 1000);
    }
  }, [user?.id, displayDays, isLoading, refreshStats, stats, simpleDaysInUse]);
  
  // Show loading state
  if (isLoading) {
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
            <View style={styles.toothbrushContentContainer}>
              <View style={styles.toothbrushHealthContainer}>
                <View style={styles.heartContainer}>
                  <MaterialCommunityIcons 
                    name="heart-half-full" 
                    size={48} 
                    color={Colors.primary[200]} 
                  />
                </View>
                <View style={styles.daysTextContainer}>
                  <ThemedText 
                    variant="title" 
                    style={[styles.daysValue, fontFamily && { fontFamily }]}
                  >
                    --
                  </ThemedText>
                  <ThemedText variant="caption" style={styles.daysText}>
                    {t('homeScreen.toothbrushCard.daysUnit')}
                  </ThemedText>
                </View>
                <ThemedText variant="caption" style={styles.replaceSoonText} numberOfLines={2}>
                  {t('common.loading', 'Loading...')}
                </ThemedText>
              </View>
              <Image 
                source={require('../../assets/images/toothbrush.png')}
                style={styles.toothbrushImage}
                resizeMode="contain"
              />
            </View>
          }
          maxValue=""
          progress={0}
          progressLabels={[]}
          height={165}
          containerStyle={styles.toothbrushCardContainer}
          contentStyle={styles.toothbrushCardContent}
          cardStyle={styles.toothbrushCardStyle}
        />
      </Pressable>
    );
  }

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
        <View style={styles.toothbrushContentContainer}>
          {/* Health indicator (heart) and days */}
          <View style={styles.toothbrushHealthContainer}>
            <View style={styles.heartContainer}>
              <MaterialCommunityIcons 
                name="heart-half-full" 
                size={48} 
                color={Colors.primary[200]} 
              />
            </View>
            <View style={styles.daysTextContainer}>
                              <ThemedText 
                  variant="title" 
                  style={[
                    styles.daysValue,
                    fontFamily && { fontFamily }
                  ]}
                >
                  {displayDays}
                </ThemedText>
                <ThemedText 
                  variant="caption" 
                  style={styles.daysText}
                >
                  {t('homeScreen.toothbrushCard.daysUnit')}
                </ThemedText>
              </View>
              <ThemedText 
                variant="caption" 
                style={styles.replaceSoonText}
                numberOfLines={2}
              >
                {replacementText}
              </ThemedText>
          </View>
          
          <Image 
            source={require('../../assets/images/toothbrush.png')}
            style={styles.toothbrushImage}
            resizeMode="contain"
          />
        </View>
      }
      maxValue=""
      progress={0}
      progressLabels={[]}
      height={165}
      containerStyle={styles.toothbrushCardContainer}
      contentStyle={styles.toothbrushCardContent}
      cardStyle={styles.toothbrushCardStyle}
    />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressableContainer: {
    position: 'absolute',
    top: -35,
    right: 20,
    zIndex: 30,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  toothbrushCardContainer: {
    position: 'relative',
    zIndex: 30,
  },
  toothbrushCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 0,
    paddingHorizontal: 0,
    height: '100%',
  },
  toothbrushCardStyle: {
    padding: 2,
  },
  toothbrushContentContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toothbrushImage: {
    width: Dimensions.get('window').width * 0.32,
    height: 150,
    position: 'absolute',
    right: -25,
    top: '50%',
    transform: [
      { translateY: -75 },
      { scale: 1.1 }
    ],
  },
  toothbrushHealthContainer: {
    position: 'absolute',
    left: 12,
    top: -10,
    transform: [{ translateY: -50 }],
    flexDirection: 'column',
    alignItems: 'center',
    zIndex: 10,
    paddingHorizontal: 0,
    width: 48,
  },
  heartContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    marginBottom: 8, // Increased gap between heart and number
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysTextContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    width: 120,
    marginLeft: 20,
    marginTop: 5,
  },
  daysValue: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary[800],
    lineHeight: 34,
    marginRight: 6,
  },
  daysText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    color: Colors.primary[800],
    paddingTop: 0,
    lineHeight: 16,
  },
  replaceSoonText: {
    fontSize: 10,
    fontFamily: 'Quicksand-Medium',
    color: Colors.primary[800],
    opacity: 0.6,
    textAlign: 'right',
    marginTop: 18,
    width: 80,
    marginLeft: 33,
    lineHeight: 12,
  },
});

export default ToothbrushCard; 