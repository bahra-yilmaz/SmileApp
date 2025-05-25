import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable, FlatList, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../ThemeProvider';
import ThemedText from '../ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import PrimaryButton from '../ui/PrimaryButton';
import SecondaryButton from '../ui/SecondaryButton';

const USER_AGE_KEY = 'user_age';

interface AgeSelectionScreenProps {
  title: string;
  description: string;
  nextScreenPath: string;
  index: number;
  totalScreens: number;
}

// Define age ranges
const AGES = [
  { id: 'range_0_5', label: '0–5', value: 3 },
  { id: 'range_6_12', label: '6–12', value: 9 },
  { id: 'range_13_18', label: '13–18', value: 16 },
  { id: 'range_19_29', label: '19–29', value: 24 },
  { id: 'range_30_45', label: '30–45', value: 38 },
  { id: 'range_46_60', label: '46–60', value: 53 },
  { id: 'range_60_plus', label: '60+', value: 65 }
];
const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 60;
const VISIBLE_ITEMS = 7;

export default function AgeSelectionScreen({
  title,
  description,
  nextScreenPath,
  index,
  totalScreens,
}: AgeSelectionScreenProps) {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedAge, setSelectedAge] = useState<number>(24); // Default to 19-29 range
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Quicksand-Bold': require('../../assets/fonts/Quicksand-Bold.ttf'),
    'Merienda-Medium': require('../../assets/fonts/Merienda-Medium.ttf'),
  });
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;
  
  useEffect(() => {
    // Run animations when the component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();

    // Scroll to the default selected age
    setTimeout(() => {
      const indexToScrollTo = AGES.findIndex(age => age.value === selectedAge);
      if (indexToScrollTo !== -1 && flatListRef.current) {
        flatListRef.current.scrollToOffset({
          offset: indexToScrollTo * ITEM_HEIGHT,
          animated: true,
        });
      }
    }, 500);
  }, []);
  
  const handleSkip = () => {
    router.push(nextScreenPath as any);
  };

  const handleNext = async () => {
    // Save the selected age
    try {
      // Save both the numeric value and the label for special cases
      const ageData = {
        value: selectedAge,
        label: AGES.find(a => a.value === selectedAge)?.label || selectedAge.toString()
      };
      await AsyncStorage.setItem(USER_AGE_KEY, JSON.stringify(ageData));
    } catch (error) {
      console.error('Error saving age:', error);
    }
    router.push(nextScreenPath as any);
  };

  const handleSelectAge = (item: typeof AGES[0]) => {
    setSelectedAge(item.value);
    const indexToScrollTo = AGES.findIndex(age => age.id === item.id);
    if (indexToScrollTo !== -1 && flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: indexToScrollTo * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const renderAgeItem = ({ item }: { item: typeof AGES[0] }) => {
    const isSelected = item.value === selectedAge;
    const fontFamily = fontsLoaded ? 'Quicksand-Bold' : undefined;
    
    return (
      <Pressable
        style={[
          styles.ageItem,
          isSelected && styles.selectedAgeItem
        ]}
        onPress={() => handleSelectAge(item)}
      >
        <ThemedText 
          style={[
            styles.ageText, 
            { fontFamily },
            isSelected && { 
              color: theme.colors.primary[500],
              fontSize: 24,
            }
          ]}
        >
          {item.label}
        </ThemedText>
      </Pressable>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  });

  const onScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const index = Math.round(scrollPosition / ITEM_HEIGHT);
    const age = AGES[index];
    
    if (age !== undefined && age.value !== selectedAge) {
      setSelectedAge(age.value);
    }
  };

  // Calculate header height to position progress indicators below it
  const headerHeight = insets.top + (Platform.OS === 'ios' ? 10 : 15) + 16 + 32; // SafeArea + additionalPadding + paddingVertical + fontSize

  return (
    <View style={styles.container}>
      {/* Progress indicators - positioned below header */}
      <View style={[styles.progressContainer, { top: headerHeight + 10 }]}>
        <View style={styles.indicators}>
          {Array(totalScreens).fill(0).map((_, i) => (
            <View 
              key={i}
              style={[
                styles.indicator,
                { 
                  backgroundColor: i === index 
                    ? theme.colors.primary[600] 
                    : 'white',
                  width: i === index ? 24 : 8,
                  opacity: i === index ? 1 : 0.7
                }
              ]}
            />
          ))}
        </View>
        
        {/* Question text */}
        <View style={styles.questionContainer}>
          <ThemedText style={[
            styles.questionText,
            { fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined }
          ]}>
            How old are you?
          </ThemedText>
        </View>
      </View>
      
      {/* Age Selection Wheel - positioned in center */}
      <View style={styles.agePickerContainer}>
        {/* Highlight for the selected item */}
        <View style={[
          styles.selectedHighlight,
          { 
            borderColor: theme.colors.primary[200],
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }
        ]} />
        
        <FlatList
          ref={flatListRef}
          data={AGES}
          renderItem={renderAgeItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onScroll}
          style={styles.ageList}
          contentContainerStyle={{
            paddingVertical: (VISIBLE_ITEMS - 1) * ITEM_HEIGHT / 2,
          }}
        />

        {/* Child mode button - positioned below the wheel */}
        <View style={styles.childButtonContainer}>
          <SecondaryButton
            label="Use for child"
            onPress={() => {}}
            width={160}
            textStyle={{ 
              fontFamily: fontsLoaded ? 'Quicksand-Bold' : undefined,
              fontSize: 16
            }}
          />
        </View>
      </View>
      
      {/* Action buttons - positioned at bottom */}
      <View style={styles.buttonsContainer}>
        <PrimaryButton 
          label="Continue"
          onPress={handleNext}
          width={width * 0.85}
          useDisplayFont={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  progressContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
    zIndex: 5,
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  agePickerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '60%',
    marginLeft: -width * 0.3, // Half of container width
    marginTop: -(ITEM_HEIGHT * VISIBLE_ITEMS) / 2, // Half of container height
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedHighlight: {
    position: 'absolute',
    height: ITEM_HEIGHT,
    width: width * 0.3,
    borderRadius: 30,
    borderWidth: 2,
    top: '50%',
    marginTop: -ITEM_HEIGHT / 2,
  },
  ageList: {
    width: '100%',
  },
  ageItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedAgeItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '700',
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    opacity: 0.7,
    color: 'white',
  },
  nextButton: {
    backgroundColor: '#0095E6',
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    color: 'white',
    fontWeight: 'bold',
  },
  childButtonContainer: {
    position: 'absolute',
    top: '100%', // Position right at the bottom of the wheel container
    marginTop: 10, // Reduced from 20 to bring it higher
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  questionContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
  },
}); 