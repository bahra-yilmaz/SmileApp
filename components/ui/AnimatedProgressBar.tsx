import React, { useEffect, useRef, useState } from 'react';
import { Animated, View, StyleProp, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface AnimatedProgressBarProps {
  /** Progress percentage (0 – 100) */
  progress: number;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Height of the progress bar */
  height?: number;
  /** Background color of the track */
  trackColor?: string;
  /** Fill color for progress */
  fillColor?: string;
  /** Additional styles for the container */
  containerStyle?: StyleProp<ViewStyle>;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  duration = 800,
  height = 8,
  trackColor = 'rgba(200, 200, 220, 0.3)',
  fillColor = Colors.primary[500],
  containerStyle,
}) => {
  // Holds the width of the track, needed to convert progress % into pixel width.
  const [trackWidth, setTrackWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration,
      useNativeDriver: false,
    }).start();
  }, [progress, duration, animatedValue]);

  // Interpolate progress percent into pixel width once the track width is known.
  const widthInterpolated = trackWidth
    ? animatedValue.interpolate({
        inputRange: [0, 100],
        outputRange: [0, trackWidth],
      })
    : 0;

  return (
    <View
      style={[{ width: '100%', height, borderRadius: height / 2, backgroundColor: trackColor, overflow: 'hidden' }, containerStyle]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: fillColor,
          width: widthInterpolated,
        }}
      />
    </View>
  );
};

export default AnimatedProgressBar; 