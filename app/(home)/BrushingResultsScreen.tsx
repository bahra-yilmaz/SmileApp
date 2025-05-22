import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Pressable } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import ThemedText from '../../components/ThemedText';
import PrimaryButton from '../../components/ui/PrimaryButton';
import LightContainer from '../../components/ui/LightContainer';
import GlassmorphicCard from '../../components/ui/GlassmorphicCard';
import DonutChart from '../../components/ui/DonutChart';
import { Colors } from '../../constants/Colors';
import { Feather } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const BrushingResultsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    'Merienda-Bold': require('../../assets/fonts/Merienda-Bold.ttf'),
    'Quicksand-Medium': require('../../assets/fonts/Quicksand-Medium.ttf'),
  });

  const brushingMinutes = 2;
  const brushingSeconds = 30;

  if (!fontsLoaded) {
    return null;
  }

  const cardWidth = screenWidth * 0.4;
  const cardHeight = 110;

  const card1Data = { progress: 0.75, value: "150", label: "Points" };
  const card2Data = { progress: 0.50, value: "+2", label: "Bonus" };

  const handleShare = () => {
    // Placeholder for share functionality
    console.log('Share button pressed');
    // You would typically use React Native's Share API here
    // Share.share({ message: 'I just completed my brushing session! Check out SmileApp.' });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/shiny-background.png')}
        style={styles.backgroundImage}
      />
      <View style={[styles.topContentContainerWrapper, { paddingTop: insets.top + 40 }]}>
        <ThemedText style={styles.title} variant="title">Brushing Complete!</ThemedText>
        <ThemedText style={styles.message}>Great job on brushing your teeth!</ThemedText>

        <View style={styles.timeCardContainer}>
          <ThemedText style={[styles.cardText, { fontFamily: 'Merienda-Bold' }]}>
            {String(brushingMinutes).padStart(2, '0')}:{String(brushingSeconds).padStart(2, '0')}
          </ThemedText>
          <ThemedText style={styles.cardTitle}>Time Spent Brushing</ThemedText>
        </View>
      </View>

      <LightContainer
        style={[
          styles.bottomLightContainer,
          {
            height: screenHeight / 2.3,
            paddingBottom: insets.bottom + 10,
            flex: 0,
          }
        ]}
      >
        <View style={styles.cardsRowContainer}>
          <View style={styles.shadowWrapper}> 
            <GlassmorphicCard
              width={cardWidth}
              borderRadius="md"
              intensity={60}
              shadow="none"
              containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
              style={styles.resultCardContent}
            >
              <View style={styles.metricContentContainer}>
                <View style={styles.metricDonutContainer}>
                  <DonutChart
                    progress={card1Data.progress}
                    size={60}
                    thickness={10}
                    progressColor={Colors.primary[500]}
                  />
                </View>
                <View style={styles.metricTextContainer}>
                  <ThemedText style={styles.metricValue}>{card1Data.value}</ThemedText>
                  <ThemedText style={styles.metricLabel}>{card1Data.label}</ThemedText>
                </View>
              </View>
            </GlassmorphicCard>
          </View>

          <View style={styles.shadowWrapper}>
            <GlassmorphicCard
              width={cardWidth}
              borderRadius="md"
              intensity={60}
              shadow="none"
              containerStyle={[styles.resultCardContainer, { height: cardHeight }]}
              style={styles.resultCardContent}
            >
              <View style={styles.metricContentContainer}>
                <View style={styles.metricDonutContainer}>
                  <DonutChart
                    progress={card2Data.progress}
                    size={60}
                    thickness={10}
                    progressColor={Colors.primary[500]}
                  />
                </View>
                <View style={styles.metricTextContainer}>
                  <ThemedText style={styles.metricValue}>{card2Data.value}</ThemedText>
                  <ThemedText style={styles.metricLabel}>{card2Data.label}</ThemedText>
                </View>
              </View>
            </GlassmorphicCard>
          </View>
        </View>

        <View style={styles.motivationalContainer}>
          <ThemedText style={styles.motivationalText}>
            Keep up the sparkle! Every brush counts.
          </ThemedText>
          <Image
            source={require('../../assets/mascot/nubo-welcoming-1.png')}
            style={styles.motivationalMascotImage}
          />
        </View>

        <View style={styles.buttonRowContainer}>
          <View style={styles.leftActionButtonsContainer}> 
            <Pressable onPress={() => router.back()} style={styles.actionButton}> 
              <Feather name="x" size={28} color={Colors.primary[500]} />
            </Pressable>
            <Pressable onPress={handleShare} style={[styles.actionButton, { marginLeft: 10 }]}> 
              <Feather name="share-2" size={24} color={Colors.primary[500]} />
            </Pressable>
          </View>
          <PrimaryButton
            label="Go Home"
            onPress={() => router.push('/(home)')}
            style={styles.goHomeButton}
            useDisplayFont={true}
          />
        </View>
      </LightContainer>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backgroundImage: {
    position: 'absolute',
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'cover',
    left: 0,
    top: 0,
    zIndex: -1,
  },
  topContentContainerWrapper: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#FFFFFF',
  },
  timeCardContainer: {
    width: '90%',
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: -20,
    backgroundColor: 'transparent',
    marginTop: 30,
  },
  cardTitle: {
    fontSize: 16,
    opacity: 0.8,
    marginTop: 4,
    color: '#FFFFFF',
  },
  cardText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
    lineHeight: 76,
  },
  bottomLightContainer: {
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardsRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: -65,
    marginBottom: 20,
  },
  shadowWrapper: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  resultCardContainer: {
    borderRadius: 12,
  },
  resultCardContent: {
    padding: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  metricDonutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginLeft: -15,
  },
  metricTextContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary[800],
    fontFamily: 'Merienda-Bold',
    lineHeight: 34,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'Quicksand-Medium',
    opacity: 0.8,
    color: Colors.primary[800],
    marginTop: 2,
  },
  motivationalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginVertical:25,
  },
  motivationalText: {
    fontSize: 16,
    color: Colors.neutral[800],
    fontFamily: 'Quicksand-Medium',
    flex: 1,
    textAlign: 'left',
  },
  motivationalMascotImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  buttonRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  leftActionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary[300],
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goHomeButton: {
    flex: 1,
    marginLeft: 10,
    paddingHorizontal: 20,
  }
});

export default BrushingResultsScreen; 