import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Song {
  id: string;
  name: string;
}

interface SongMenuProps {
  currentSongName?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSelectSong?: (song: Song) => void;
  songs?: Song[];
  onSelectNoSound?: () => void;
}

const DEFAULT_SONGS: Song[] = [
  { id: 'song1', name: 'Rainy Mood' },
  { id: 'song2', name: 'Forest Ambience' },
  { id: 'song3', name: 'Cafe Sounds' },
];

export const SongMenu: React.FC<SongMenuProps> = ({
  currentSongName = "Select a sound",
  isPlaying = false,
  onPlayPause,
  onSelectSong,
  songs = DEFAULT_SONGS,
  onSelectNoSound,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const styles = createStyles(theme, insets);

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    Animated.timing(animation, {
      toValue,
      duration: 300,
      useNativeDriver: false, // height and opacity are not always optimal with native driver
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const menuHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (songs.length + 1) * 50], 
  });

  const renderVisualizer = () => {
    const barCount = 30;
    // Predefined heights for a sound wave look (symmetric pattern)
    const waveHeights = [
      4, 6, 8, 10, 12, 10, 8, 6, 4, 5, 7, 9, 11, 9, 7,
      7, 9, 11, 9, 7, 5, 4, 6, 8, 10, 12, 10, 8, 6, 4
    ];

    return (
      <View style={styles.visualizerContainer}>
        {[...Array(barCount)].map((_, i) => {
          return (
            <View // Changed from Animated.View as no animation needed for bars
              key={i}
              style={[
                styles.visualizerBar,
                {
                  height: waveHeights[i % waveHeights.length], 
                  backgroundColor: theme.colorScheme === 'dark' ? '#161D26' : '#E0E8EF', // Made rectangle colors a bit darker
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Shadow Wrapper for Collapsed Bar */}
      <View style={styles.shadowWrapper}>
        <BlurView tint={theme.colorScheme === 'dark' ? 'dark' : 'light'} intensity={80} style={styles.blurViewStyle}> 
          <View style={styles.collapsedBarContainer}> 
            <TouchableOpacity onPress={onPlayPause} style={styles.playPauseButton}>
              <MaterialCommunityIcons
                name={isPlaying ? "pause" : "play"}
                size={40} // Further Increased play button size again
                color={theme.activeColors.text}
              />
            </TouchableOpacity>
            <View style={styles.songInfoContainer}>
              <Text style={styles.songNameText} numberOfLines={1}>{currentSongName}</Text>
              {renderVisualizer()}
            </View>
            <TouchableOpacity onPress={toggleMenu} style={styles.toggleButton}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={22}
                color={theme.colors.primary[200]} // Color from TimerCircle's center circle
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>

      {/* Shadow Wrapper for Menu Options */}
      <Animated.View style={[styles.menuOptionsShadowWrapper, { height: menuHeight, opacity: animation }]}>
        <View style={styles.shadowWrapper}> 
          <BlurView tint={theme.colorScheme === 'dark' ? 'dark' : 'light'} intensity={90} style={styles.blurViewOptionsStyle}> 
            <View style={styles.menuOptionsContainer}>
              {songs.map((song) => (
                <TouchableOpacity
                  key={song.id}
                  style={styles.menuItem}
                  onPress={() => {
                    onSelectSong?.(song);
                    toggleMenu(); // Close menu on selection
                  }}
                >
                  <MaterialCommunityIcons name="music-note" size={20} color={theme.activeColors.text} />
                  <Text style={styles.menuItemText}>{song.name}</Text>
                </TouchableOpacity>
              ))}
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onSelectNoSound?.();
                  toggleMenu(); // Close menu on selection
                }}
              >
                <MaterialCommunityIcons name="volume-off" size={20} color={theme.activeColors.text} />
                <Text style={styles.menuItemText}>No Sound</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: insets.top + 10,
    left: 65,
    right: 65,
    zIndex: 2100,
    alignItems: 'center',
  },
  shadowWrapper: { 
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 40, // Changed corner radius to 40
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4, // Softer shadow offset
    },
    shadowOpacity: 0.15, // Softer shadow opacity
    shadowRadius: 6, // Softer shadow radius
    elevation: 8, // Softer elevation for Android
  },
  blurViewStyle: { 
    width: '100%',
    borderRadius: 30, // Add borderRadius to BlurView itself
    overflow: 'hidden', // Add overflow: hidden to BlurView itself
  },
  blurViewOptionsStyle: { // Specific for options if different intensity/tint, or merge with blurViewStyle
    width: '100%',
    borderRadius: 30, // Add borderRadius to BlurView itself
    overflow: 'hidden', // Add overflow: hidden to BlurView itself
  },
  collapsedBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colorScheme === 'dark' ? 'rgba(40, 40, 40, 0.65)' : 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    width: '100%',
    borderRadius: 40, // Confirmed: Changed corner radius to 40
    overflow: 'hidden',
  },
  playPauseButton: {
    padding: 5, 
    marginRight: 5, 
    marginLeft: -5, // Move play button 5px to the left
  },
  songInfoContainer: {
    flex: 1,
    marginLeft: 3, // Adjusted: Original 10, shifted 7px left in total
    marginRight: 10,
    justifyContent: 'center',
  },
  songNameText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.activeColors.text,
    fontFamily: 'Quicksand', // Changed font to Quicksand
    marginBottom: 5, // Space between song name and visualizer
  },
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Align bars to the bottom
    height: 20, // Fixed height for visualizer area
  },
  visualizerBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  toggleButton: {
    padding: 5,
    position: 'relative',
    bottom: 13, 
  },
  menuOptionsShadowWrapper: { // Wrapper for the animated height/opacity part OF THE SHADOW VIEW
    width: '100%',
    marginTop: 8,
    // overflow: 'hidden', // This might clip shadow if applied here, shadow wrapper will handle rounding
    // borderRadius for shadow shape is on shadowWrapper
  },
  menuOptionsContainer: {
    paddingVertical: 5,
    backgroundColor: theme.colorScheme === 'dark' ? 'rgba(50, 50, 50, 0.7)' : 'rgba(245, 245, 245, 0.8)',
    borderRadius: 40, // Changed corner radius to 40
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    color: theme.activeColors.text,
    fontSize: 15,
    marginLeft: 15,
  },
  separator: {
    height: 1,
    backgroundColor: theme.activeColors.border, // Use theme border color
    marginHorizontal: 15,
    marginVertical: 5,
  },
});

export default SongMenu; 