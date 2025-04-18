import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/Colors';

interface DonutChartProps {
  /**
   * Progress percentage (0-100)
   */
  progress: number;
  
  /**
   * Size of the donut chart
   */
  size?: number;
  
  /**
   * Thickness of the donut ring
   */
  thickness?: number;
  
  /**
   * Color of the filled progress
   */
  progressColor?: string;
  
  /**
   * Color of the unfilled track
   */
  trackColor?: string;
  
  /**
   * Content to display in the center
   */
  centerContent?: React.ReactNode;

  /**
   * Additional style for the container
   */
  style?: any;
}

/**
 * A reusable donut chart component to visualize progress
 */
export default function DonutChart({
  progress,
  size = 80,
  thickness = 8,
  progressColor = Colors.primary[500],
  trackColor = 'rgba(200, 200, 220, 0.3)',
  centerContent,
  style
}: DonutChartProps) {
  // Calculate SVG parameters
  const radius = size / 2;
  const innerRadius = radius - thickness;
  const circumference = 2 * Math.PI * innerRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="transparent"
          stroke={trackColor}
          strokeWidth={thickness}
        />
        
        {/* Progress arc */}
        <Circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="transparent"
          stroke={progressColor}
          strokeWidth={thickness}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${radius}, ${radius}`}
        />
      </Svg>
      
      {/* Center content */}
      {centerContent && (
        <View style={styles.centerContent}>
          {centerContent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  }
}); 