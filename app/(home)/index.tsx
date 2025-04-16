import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import HeaderLogo from '../../components/ui/HeaderLogo';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { spacing } = theme;
  const insets = useSafeAreaInsets();
  
  // Get screen dimensions
  const { height: screenHeight, width: screenWidth } = Dimensions.get('window');
  // Calculate container height
  const containerHeight = screenHeight * 0.65;
  // Calculate circle size (20% of screen width - smaller than before)
  const circleSize = screenWidth * 0.2;
  
  return (
    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Smile Header in safe area */}
        <SafeAreaView style={styles.headerContainer}>
          <HeaderLogo />
        </SafeAreaView>
        
        {/* Circular Glassmorphic Card below header - positioned higher */}
        <View style={[styles.cardContainer, { top: 80 + insets.top }]}>
          <GlassmorphicCard
            width={circleSize}
            borderRadius="pill"
            intensity={40}
            shadow="lg"
            containerStyle={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            }}
            style={{
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            }}
          />
        </View>
        
        {/* Light Container positioned at the absolute bottom with fixed height */}
        <LightContainer 
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: containerHeight,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
            flex: 0, // Override flex to use fixed height
          }}
        >
          {/* Content for the light container will go here */}
        </LightContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  headerContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 10,
  },
  cardContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
}); 