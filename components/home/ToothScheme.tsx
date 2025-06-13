import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../ThemeProvider';
import TimerControls from './TimerControls';
import Svg, { G, Path } from 'react-native-svg';
import ThemedText from '../ThemedText';
import { Colors } from '../../constants/Colors';

interface ToothSchemeProps {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  hasCompleted: boolean;
  isOvertime: boolean;
  overtimeCounter: number;
  initialTimeInSeconds: number;
  onStartPress: () => void;
  onBrushedPress: () => void;
  onResetPress: () => void;
}

export default function ToothScheme({
  minutes,
  seconds,
  isRunning,
  hasCompleted,
  isOvertime,
  overtimeCounter,
  initialTimeInSeconds,
  onStartPress,
  onBrushedPress,
  onResetPress,
}: ToothSchemeProps) {
  const { theme } = useTheme();
  
  // Calculate progress for tooth highlighting
  const totalSeconds = minutes * 60 + seconds;
  const progress = 1 - (totalSeconds / initialTimeInSeconds);

  // Format time as M:SS (no leading zero for minutes)
  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate overtime display
  const overtimeDisplayMinutes = Math.floor(overtimeCounter / 60);
  const overtimeDisplaySeconds = overtimeCounter % 60;

  // Brushing sequence: upper left → upper front → upper right → lower right → lower front → lower left
  const toothSections = [
    'upper-left',
    'upper-front',
    'upper-right',
    'lower-right',
    'lower-front',
    'lower-left',
  ];

  // Rotation: shift starting section based on current day (midnight UTC)
  const sectionsCount = toothSections.length;
  const dayOffset = Math.floor(Date.now() / 86400000) % sectionsCount; // 0-5

  // Calculate which sections should be highlighted based on progress
  const getToothSectionColor = (sectionIndex: number): string => {
    const sectionProgress = progress * toothSections.length;
    const isDark = theme.colorScheme === 'dark';
    
    // If timer hasn't started (progress is 0 or very close to 0), all sections same color
    if (progress <= 0.001) {
      return '#E5F2FF';
    }
    
    if (hasCompleted) {
      // All sections white when completed
      return '#FFFFFF';
    }
    
    // Apply dayOffset so the starting section rotates daily
    const logicalIndex = (sectionIndex - dayOffset + sectionsCount) % sectionsCount;

    // A section is only completed when we've FULLY moved past it
    if (logicalIndex < Math.floor(sectionProgress)) {
      // Completed sections - pure white (only when fully completed)
      return '#FFFFFF';
    } else if (logicalIndex === Math.floor(sectionProgress)) {
      // Currently active section - primary 500
      return Colors.primary[500];
    } else {
      // Upcoming sections - same as timer outer circle
      return '#E5F2FF';
    }
  };

  return (
    <View style={styles.container}>
      {/* Main Content Container - Centers everything relative to screen */}
      <View style={styles.mainContentContainer}>
        {/* Tooth Scheme SVG Container */}
        <View style={styles.svgContainer}>
          <Svg width="300" height="450" viewBox="0 0 250 375">
            <G id="Teeth Scheme">
              {/* Upper Left */}
              <G id="upper-left">
                <Path 
                  d="M42.5 59C51.0604 59 58 65.9396 58 74.5C58 80.5027 54.5872 85.7073 49.5967 88.2822C51.1224 90.8314 52 93.8131 52 97C52 102.902 48.9919 108.1 44.4258 111.148C47.8777 114.743 50 119.623 50 125C50 131.221 47.1592 136.777 42.7051 140.445C45.9917 144.009 48 148.77 48 154C48 165.046 39.0457 174 28 174C16.9543 174 8 165.046 8 154C8 147.779 10.8398 142.222 15.2939 138.554C12.0078 134.99 10 130.23 10 125C10 117.089 14.5932 110.252 21.2578 107.008C19.2096 104.2 18 100.742 18 97C18 89.894 22.3601 83.8069 28.5508 81.2666C27.5571 79.222 27 76.926 27 74.5C27 65.9396 33.9396 59 42.5 59Z" 
                  fill={getToothSectionColor(0)}
                />
              </G>
              
              {/* Lower Left */}
              <G id="lower-left">
                <Path 
                  d="M42.5 319C51.0604 319 58 312.06 58 303.5C58 297.497 54.5872 292.293 49.5967 289.718C51.1224 287.169 52 284.187 52 281C52 275.098 48.9919 269.9 44.4258 266.852C47.8777 263.257 50 258.377 50 253C50 246.779 47.1592 241.223 42.7051 237.555C45.9917 233.991 48 229.23 48 224C48 212.954 39.0457 204 28 204C16.9543 204 8 212.954 8 224C8 230.221 10.8398 235.778 15.2939 239.446C12.0078 243.01 10 247.77 10 253C10 260.911 14.5932 267.748 21.2578 270.992C19.2096 273.8 18 277.258 18 281C18 288.106 22.3601 294.193 28.5508 296.733C27.5571 298.778 27 301.074 27 303.5C27 312.06 33.9396 319 42.5 319Z" 
                  fill={getToothSectionColor(5)}
                />
              </G>
              
              {/* Upper Right */}
              <G id="upper-right">
                <Path 
                  d="M206.5 59C197.94 59 191 65.9396 191 74.5C191 80.5027 194.413 85.7073 199.403 88.2822C197.878 90.8314 197 93.8131 197 97C197 102.902 200.008 108.1 204.574 111.148C201.122 114.743 199 119.623 199 125C199 131.221 201.841 136.777 206.295 140.445C203.008 144.009 201 148.77 201 154C201 165.046 209.954 174 221 174C232.046 174 241 165.046 241 154C241 147.779 238.16 142.222 233.706 138.554C236.992 134.99 239 130.23 239 125C239 117.089 234.407 110.252 227.742 107.008C229.79 104.2 231 100.742 231 97C231 89.894 226.64 83.8069 220.449 81.2666C221.443 79.222 222 76.926 222 74.5C222 65.9396 215.06 59 206.5 59Z" 
                  fill={getToothSectionColor(2)}
                />
              </G>
              
              {/* Lower Right */}
              <G id="lower-right">
                <Path 
                  d="M206.5 319C197.94 319 191 312.06 191 303.5C191 297.497 194.413 292.293 199.403 289.718C197.878 287.169 197 284.187 197 281C197 275.098 200.008 269.9 204.574 266.852C201.122 263.257 199 258.377 199 253C199 246.779 201.841 241.223 206.295 237.555C203.008 233.991 201 229.23 201 224C201 212.954 209.954 204 221 204C232.046 204 241 212.954 241 224C241 230.221 238.16 235.778 233.706 239.446C236.992 243.10 239 247.77 239 253C239 260.911 234.407 267.748 227.742 270.992C229.79 273.8 231 277.258 231 281C231 288.106 226.64 294.193 220.449 296.733C221.443 298.778 222 301.074 222 303.5C222 312.06 215.06 319 206.5 319Z" 
                  fill={getToothSectionColor(3)}
                />
              </G>
              
              {/* Upper Front */}
              <G id="upper-front">
                <Path 
                  d="M138 3C145.82 3 152.535 7.72405 155.45 14.4736C157.923 12.9071 160.856 12 164 12C170.903 12 176.786 16.3713 179.029 22.4971C180.299 22.1728 181.629 22 183 22C191.837 22 199 29.1634 199 38C199 46.8366 191.837 54 183 54C176.097 54 170.215 49.628 167.972 43.502C166.702 43.8264 165.371 44 164 44C158.248 44 153.207 40.9641 150.387 36.4082C147.061 39.2703 142.732 41 138 41C132.459 41 127.473 38.6275 124 34.8438C120.527 38.6275 115.541 41 110 41C105.268 41 100.939 39.2703 97.6133 36.4082C94.7933 40.9641 89.7518 44 84 44C82.6289 44 81.2984 43.8264 80.0283 43.502C77.7849 49.628 71.9033 54 65 54C56.1634 54 49 46.8366 49 38C49 29.1634 56.1634 22 65 22C66.3707 22 67.701 22.1728 68.9707 22.4971C71.2143 16.3713 77.0969 12 84 12C87.1442 12 90.0766 12.9071 92.5498 14.4736C95.4649 7.72405 102.18 3 110 3C115.541 3 120.527 5.37187 124 9.15527C127.473 5.37187 132.459 3 138 3Z" 
                  fill={getToothSectionColor(1)}
                />
              </G>
              
              {/* Lower Front */}
              <G id="lower-front">
                <Path 
                  d="M183 324C191.837 324 199 331.163 199 340C199 348.837 191.837 356 183 356C180.275 356 177.71 355.319 175.464 354.117C173.647 360.958 167.413 366 160 366C156.426 366 153.126 364.828 150.463 362.848C147.897 368.258 142.386 372 136 372C131.221 372 126.932 369.903 124 366.581C121.068 369.903 116.779 372 112 372C105.614 372 100.102 368.258 97.5361 362.848C94.8729 364.828 91.5736 366 88 366C80.5869 366 74.3518 360.959 72.5352 354.117C70.2896 355.318 67.7246 356 65 356C56.1634 356 49 348.837 49 340C49 331.163 56.1634 324 65 324C72.4126 324 78.6468 329.041 80.4639 335.882C82.7095 334.681 85.2753 334 88 334C94.3858 334 99.8966 337.741 102.463 343.151C105.126 341.171 108.426 340 112 340C116.779 340 121.068 342.096 124 345.418C126.932 342.096 131.221 340 136 340C139.573 340 142.873 341.172 145.536 343.151C148.102 337.741 153.614 334 160 334C162.724 334 165.29 334.681 167.535 335.882C169.352 329.041 175.587 324 183 324Z" 
                  fill={getToothSectionColor(4)}
                />
              </G>

              {/* L Label */}
              <Path
                d="M30.1629 192.596C30.3709 192.596 30.5429 192.664 30.6789 192.8C30.8229 192.928 30.8949 193.096 30.8949 193.304C30.8949 193.504 30.8229 193.672 30.6789 193.808C30.5429 193.936 30.3709 194 30.1629 194H26.2629C26.0549 194 25.8789 193.932 25.7349 193.796C25.5989 193.652 25.5309 193.476 25.5309 193.268V186.332C25.5309 186.124 25.6029 185.952 25.7469 185.816C25.8909 185.672 26.0749 185.6 26.2989 185.6C26.4909 185.6 26.6589 185.672 26.8029 185.816C26.9549 185.952 27.0309 186.124 27.0309 186.332V192.8L26.7669 192.596H30.1629Z"
                fill={Colors.primary[500]}
                fillOpacity={0.6}
              />

              {/* R Label */}
              <Path
                d="M218.645 194C218.421 194 218.221 193.932 218.045 193.796C217.869 193.652 217.781 193.476 217.781 193.268V186.332C217.781 186.124 217.849 185.952 217.985 185.816C218.129 185.672 218.305 185.6 218.513 185.6H221.969C222.385 185.6 222.773 185.712 223.133 185.936C223.501 186.152 223.797 186.456 224.021 186.848C224.245 187.232 224.357 187.676 224.357 188.18C224.357 188.484 224.293 188.78 224.165 189.068C224.045 189.356 223.877 189.616 223.661 189.848C223.453 190.08 223.217 190.26 222.953 190.388L222.965 190.112C223.189 190.232 223.373 190.376 223.517 190.544C223.669 190.704 223.785 190.88 223.865 191.072C223.953 191.256 224.005 191.456 224.021 191.672C224.053 191.872 224.073 192.048 224.081 192.2C224.097 192.352 224.121 192.48 224.153 192.584C224.193 192.688 224.265 192.768 224.369 192.824C224.545 192.928 224.653 193.08 224.693 193.28C224.741 193.472 224.697 193.644 224.561 193.796C224.473 193.9 224.361 193.968 224.225 194C224.089 194.024 223.953 194.024 223.817 194C223.681 193.968 223.569 193.928 223.481 193.88C223.345 193.8 223.209 193.684 223.073 193.532C222.937 193.372 222.825 193.16 222.737 192.896C222.657 192.632 222.617 192.292 222.617 191.876C222.617 191.74 222.593 191.616 222.545 191.504C222.497 191.384 222.429 191.284 222.341 191.204C222.253 191.116 222.141 191.052 222.005 191.012C221.869 190.964 221.709 190.94 221.525 190.94H219.101L219.281 190.664V193.268C219.281 193.476 219.225 193.652 219.113 193.796C219.001 193.932 218.845 194 218.645 194ZM219.113 189.704H221.909C222.053 189.704 222.193 189.64 222.329 189.512C222.465 189.376 222.577 189.196 222.665 188.972C222.753 188.74 222.797 188.488 222.797 188.216C222.797 187.864 222.701 187.572 222.509 187.34C222.325 187.1 222.125 186.98 221.909 186.98H219.137L219.281 186.596V189.992L219.113 189.704Z"
                fill={Colors.primary[500]}
                fillOpacity={0.6}
              />
            </G>
          </Svg>
          
          {/* Centered Timer Display - matching TimerCircle styling */}
          <View style={styles.centeredTimerContainer}>
            <ThemedText 
              style={[styles.centeredTimerText, { color: Colors.primary[500] }]}
              weight="bold"
              useDisplayFont
            >
              {isOvertime 
                ? `+${formatTime(overtimeDisplayMinutes, overtimeDisplaySeconds)}` 
                : formatTime(minutes, seconds)}
            </ThemedText>
          </View>
        </View>

        {/* Control Buttons - Positioned below the scheme */}
        <View style={styles.controlsContainer}>
          <TimerControls
            isRunning={isRunning}
            onStartPress={onStartPress}
            onBrushedPress={onBrushedPress}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centeredTimerContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    transform: [{ translateY: -32.5 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    height: 65,
  },
  centeredTimerText: {
    fontFamily: 'Merienda-Bold',
    fontSize: 56,
    textAlign: 'center',
    lineHeight: 65,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
}); 