import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import StatCard from '../ui/StatCard';
import ThemedText from '../ThemedText';
import DonutChart from '../ui/DonutChart';
import { Colors } from '../../constants/Colors';

interface BrushingTimeCardProps {
  minutes: number;
  seconds: number;
  targetMinutes?: number;
  fontFamily?: string;
}

const BrushingTimeCard: React.FC<BrushingTimeCardProps> = ({
  minutes,
  seconds,
  targetMinutes = 3,
  fontFamily,
}) => {
  // Calculate progress as a percentage
  const progress = ((minutes + seconds / 60) / targetMinutes) * 100;
  
  return (
    <StatCard
      title=""
      value={
        <View style={styles.brushingTimeValueContainer}>
          <View style={styles.brushingTimeDonutContainer}>
            <DonutChart
              progress={progress}
              size={38}
              thickness={6}
              progressColor={Colors.primary[200]}
              style={styles.brushingTimeDonut}
            />
          </View>
          <ThemedText 
            variant="title" 
            style={[
              styles.brushingTimeValue,
              fontFamily && { fontFamily }
            ]}
          >
            {minutes}
            <ThemedText
              style={[
                styles.brushingTimeSeconds,
                fontFamily && { fontFamily }
              ]}
            >
              :{seconds < 10 ? `0${seconds}` : seconds}
            </ThemedText>
          </ThemedText>
          <ThemedText 
            variant="caption" 
            style={styles.brushingTimeText}
          >
            minutes
          </ThemedText>
        </View>
      }
      maxValue=""
      progress={0}
      progressLabels={[]}
      containerStyle={styles.fixedBrushingTimeContainer}
      contentStyle={styles.brushingTimeCardContent}
      cardStyle={styles.brushingTimeCardStyle}
      height={74}
      width={Dimensions.get('window').width * 0.42}
    />
  );
};

const styles = StyleSheet.create({
  brushingTimeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 8,
    height: '100%',
    paddingLeft: 0,
  },
  brushingTimeDonutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
    marginLeft: -2,
  },
  brushingTimeDonut: {
    marginBottom: 8,
  },
  brushingTimeValue: {
    fontSize: 34,
    fontWeight: '700',
    marginLeft: 2,
    marginRight: 2,
    color: Colors.primary[800],
  },
  brushingTimeSeconds: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary[800],
    opacity: 0.9,
  },
  brushingTimeText: {
    fontSize: 14,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    alignSelf: 'center',
    paddingTop: 4,
    color: Colors.primary[800],
  },
  brushingTimeCardStyle: {
    padding: 0,
    height: 74,
  },
  brushingTimeCardContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: -6, // Move content 8px above
    height: '100%',
  },
  fixedBrushingTimeContainer: {
    position: 'absolute',
    top: 55,
    left: 20,
    zIndex: 30,
    width: Dimensions.get('window').width * 0.42,
  },
});

export default BrushingTimeCard; 