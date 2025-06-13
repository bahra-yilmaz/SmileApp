import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '../ThemeProvider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as DocumentPicker from 'expo-document-picker';

interface Song {
  id: string;
  name: string;
  category: 'morning' | 'afternoon' | 'evening' | 'night' | 'custom';
  icon?: string;
  isCustom?: boolean;
  uri?: string;
}

interface SongMenuProps {
  currentSongName?: string;
  isPlaying?: boolean;
  onPlayPause?: () => void;
  onSelectSong?: (song: Song) => void;
  songs?: Song[];
  onSelectNoSound?: () => void;
  opacity?: Animated.Value | Animated.AnimatedAddition<string | number>;
}

export const SongMenu: React.FC<SongMenuProps> = ({
  currentSongName,
  isPlaying = false,
  onPlayPause,
  onSelectSong,
  songs,
  onSelectNoSound,
  opacity,
}) => {
  const { t } = useTranslation();
  const [customSongs, setCustomSongs] = useState<Song[]>([]);

  const DEFAULT_SONGS_DATA: Song[] = [
    // Morning sounds (5 AM - 11 AM)
    { id: 'morning1', name: 'Morning Birds', category: 'morning', icon: 'music-note' },
    { id: 'morning2', name: 'Morning Stream', category: 'morning', icon: 'music-note' },
    { id: 'morning3', name: 'Morning Forest', category: 'morning', icon: 'music-note' },
    
    // Afternoon sounds (11 AM - 4 PM)
    { id: 'afternoon1', name: 'Cafe Ambience', category: 'afternoon', icon: 'music-note' },
    { id: 'afternoon2', name: 'Rainy Mood', category: 'afternoon', icon: 'music-note' },
    { id: 'afternoon3', name: 'Office Ambience', category: 'afternoon', icon: 'music-note' },
    
    // Evening sounds (4 PM - 8 PM)
    { id: 'evening1', name: 'Fireplace', category: 'evening', icon: 'music-note' },
    { id: 'evening2', name: 'Wind Chimes', category: 'evening', icon: 'music-note' },
    { id: 'evening3', name: 'Evening Birds', category: 'evening', icon: 'music-note' },
    
    // Night sounds (8 PM - 5 AM)
    { id: 'night1', name: 'Night Crickets', category: 'night', icon: 'music-note' },
    { id: 'night2', name: 'Ocean Waves', category: 'night', icon: 'music-note' },
    { id: 'night3', name: 'White Noise', category: 'night', icon: 'music-note' },
  ];

  const actualCurrentSongName = currentSongName ?? t('timerOverlay.songMenu.selectASound');
  const actualSongs = songs ?? DEFAULT_SONGS_DATA;

  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const styles = createStyles(theme, insets);

  const getCurrentTimeCategory = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'morning';
    if (hour >= 11 && hour < 16) return 'afternoon';
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  };

  const getFilteredSongs = () => {
    const currentCategory = getCurrentTimeCategory();
    return actualSongs.filter(song => song.category === currentCategory);
  };

  const handlePickCustomSound = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const newCustomSong: Song = {
          id: `custom-${Date.now()}`,
          name: result.assets[0].name,
          category: 'custom',
          isCustom: true,
          uri: result.assets[0].uri,
          icon: 'music-note',
        };
        setCustomSongs(prev => [...prev, newCustomSong]);
        onSelectSong?.(newCustomSong);
        toggleMenu();
      }
    } catch (error) {
      console.error('Error picking custom sound:', error);
    }
  };

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
    outputRange: [0, (actualSongs.length + 1) * 50], 
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

  const renderMenuItems = () => {
    const filteredSongs = getFilteredSongs();
    const allSongs = [...filteredSongs, ...customSongs];

    return (
      <View style={styles.menuOptionsContainer}>
        {allSongs.map((song) => (
          <TouchableOpacity
            key={song.id}
            style={styles.menuItem}
            onPress={() => {
              onSelectSong?.(song);
              toggleMenu();
            }}
          >
            <MaterialCommunityIcons 
              name={(song.icon || 'music-note') as any} 
              size={20} 
              color={theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800]} 
            />
            <Text style={styles.menuItemText}>{song.name}</Text>
          </TouchableOpacity>
        ))}
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handlePickCustomSound}
        >
          <MaterialCommunityIcons 
            name="plus-circle-outline" 
            size={20} 
            color={theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800]} 
          />
          <Text style={styles.menuItemText}>Add Custom Sound</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            onSelectNoSound?.();
            toggleMenu();
          }}
        >
          <MaterialCommunityIcons 
            name="volume-off" 
            size={20} 
            color={theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800]} 
          />
          <Text style={styles.menuItemText}>No Sound</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <>
      {/* Full-screen transparent overlay – closes the menu when tapped */}
      {isMenuOpen && (
        <Pressable
          onPress={toggleMenu}
          style={styles.fullScreenOverlay}
        />
      )}

      <Animated.View style={[styles.wrapper, opacity ? { opacity } : {}]}>
        {/* Shadow Wrapper for Collapsed Bar */}
        <View style={styles.shadowWrapper}>
          <BlurView tint={theme.colorScheme === 'dark' ? 'dark' : 'light'} intensity={80} style={styles.blurViewStyle}> 
            <View style={styles.collapsedBarContainer}> 
              <TouchableOpacity onPress={onPlayPause} style={styles.playPauseButton}>
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={40} 
                  color={theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800]} // Using primary[800] for light, primary[200] for dark
                />
              </TouchableOpacity>
              <Pressable style={styles.songInfoContainer} onPress={toggleMenu}>
                <Text style={styles.songNameText} numberOfLines={1}>{actualCurrentSongName}</Text>
                {renderVisualizer()}
              </Pressable>
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
            <BlurView 
              tint={theme.colorScheme === 'dark' ? 'dark' : 'light'} 
              intensity={70} // Intensity as a direct prop
              style={styles.blurViewOptionsStyle}
            > 
              {renderMenuItems()}
            </BlurView>
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 2000, // Just below the menu wrapper's zIndex
  },
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
    borderRadius: 30, 
    overflow: 'hidden', 
  },
  blurViewOptionsStyle: { 
    width: '100%',
    borderRadius: 30, 
    overflow: 'hidden', 
    // Matching BrushingTimeOverlay glassmorphism - intensity moved to props
    backgroundColor: theme.colorScheme === 'dark' ? 'rgba(30, 40, 60, 0.7)' : 'rgba(255, 255, 255, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
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
    color: theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800], // Using primary[800] for light, primary[200] for dark
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
  menuOptionsShadowWrapper: { 
    width: '100%',
    marginTop: 8,
  },
  menuOptionsContainer: {
    paddingVertical: 5,
    backgroundColor: 'transparent', // Background handled by BlurView now
    borderRadius: 30, 
    overflow: 'hidden', 
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemText: {
    color: theme.colorScheme === 'dark' ? theme.colors.primary[200] : theme.colors.primary[800], // Using primary[800] for light, primary[200] for dark
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