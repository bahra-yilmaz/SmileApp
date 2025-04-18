import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import GlassmorphicCard from './GlassmorphicCard';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';

interface StatCardProps {
  /**
   * Title of the stat card
   */
  title: string;
  
  /**
   * Current value
   */
  value: string | number | React.ReactNode;
  
  /**
   * Maximum or target value (including the slash)
   */
  maxValue: string;
  
  /**
   * Progress percentage (0-100)
   */
  progress: number;
  
  /**
   * Labels for the progress bar markings
   */
  progressLabels: string[];
  
  /**
   * Width of the card 
   */
  width?: number;
  
  /**
   * Height of the card (auto by default)
   */
  height?: number;
  
  /**
   * Optional style for the container
   */
  containerStyle?: any;
  
  /**
   * Optional style for the card content
   */
  contentStyle?: any;

  /**
   * Optional style for the glassmorphic card
   */
  cardStyle?: any;
}

/**
 * A reusable stat card component with progress bar
 */
export default function StatCard({
  title,
  value,
  maxValue,
  progress,
  progressLabels,
  width = Dimensions.get('window').width * 0.42,
  height,
  containerStyle,
  contentStyle,
  cardStyle
}: StatCardProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.shadowWrapper}>
        <GlassmorphicCard
          width={width}
          borderRadius="md"
          intensity={60}
          shadow="none"
          containerStyle={[
            styles.cardContainer,
            height ? { height } : null
          ]}
          style={[
            styles.card,
            height ? { height } : null,
            cardStyle
          ]}
        >
          <View style={[styles.content, contentStyle]}>
            {title ? (
              <ThemedText 
                variant="subtitle" 
                style={styles.label}
              >
                {title}
              </ThemedText>
            ) : null}
            
            {/* Progress Bar - only show if progress > 0 */}
            {progress > 0 && (
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  {/* Labels */}
                  <View style={styles.progressLabels}>
                    {progressLabels.map((label, index) => (
                      <ThemedText 
                        key={index} 
                        style={styles.progressLabel}
                      >
                        {label}
                      </ThemedText>
                    ))}
                  </View>
                </View>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { 
                      width: `${progress}%`,
                      backgroundColor: Colors.primary[600],
                    }
                  ]} 
                />
              </View>
            )}
            
            {/* Value display */}
            <View style={[
              styles.valueContainer, 
              title ? null : { marginTop: 0 }
            ]}>
              {typeof value === 'string' || typeof value === 'number' ? (
                <ThemedText 
                  variant="title" 
                  style={styles.value}
                >
                  {value}
                </ThemedText>
              ) : (
                value
              )}
              <ThemedText 
                variant="caption" 
                style={styles.maxValue}
              >
                {maxValue}
              </ThemedText>
            </View>
          </View>
        </GlassmorphicCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 15,
  },
  shadowWrapper: {
    // Focus shadow on the bottom by using a significantly positive height offset
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6, // Larger positive value pushes shadow downward
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    
    // For Android (can't control shadow direction)
    elevation: 6,
    
    // Other props
    borderRadius: 30,
    backgroundColor: 'transparent',
  },
  cardContainer: {
    borderRadius: 30, // Match the md border radius value
  },
  card: {
    padding: 10,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 13,
    opacity: 0.9,
    marginBottom: 6,
    fontFamily: 'Quicksand-Medium',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '90%',
    height: 8,
    borderRadius: 30,
    position: 'relative',
    overflow: 'visible',
    alignSelf: 'center',
  },
  progressBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(200, 200, 220, 0.3)',
    borderRadius: 30,
  },
  progressBarFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 30,
  },
  progressLabels: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    top: 12,
  },
  progressLabel: {
    fontSize: 8,
    opacity: 0.7,
    fontFamily: 'Quicksand-Regular',
    color: 'white',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Quicksand-Bold',
  },
  maxValue: {
    fontSize: 11,
    opacity: 0.7,
    marginLeft: 4,
    fontFamily: 'Quicksand-Regular',
  },
}); 