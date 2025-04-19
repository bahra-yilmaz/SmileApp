import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { format, startOfWeek, addDays, isSameDay, subWeeks } from 'date-fns';
import { BlurView } from 'expo-blur';

// Import the track color from DonutChart
const TRACK_COLOR = 'rgba(200, 200, 220, 0.3)';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange?: (date: Date) => void; // Made optional since we're disabling selection
}

// Mock brushing data for demonstration
// In a real app, this would come from your data store or API
const mockBrushingData = {
  // Format: { 'YYYY-MM-DD': number_of_times_brushed }
  [format(new Date(), 'yyyy-MM-dd')]: 2, // Today - brushed twice
  [format(addDays(new Date(), -1), 'yyyy-MM-dd')]: 1, // Yesterday - brushed once
  [format(addDays(new Date(), -2), 'yyyy-MM-dd')]: 2, // Day before - brushed twice
  [format(addDays(new Date(), -3), 'yyyy-MM-dd')]: 0, // Missed brushing
  [format(addDays(new Date(), -4), 'yyyy-MM-dd')]: 1, // Brushed once
  // Add more historical data for demonstration
  [format(addDays(new Date(), -7), 'yyyy-MM-dd')]: 2,
  [format(addDays(new Date(), -8), 'yyyy-MM-dd')]: 1,
  [format(addDays(new Date(), -9), 'yyyy-MM-dd')]: 0,
  [format(addDays(new Date(), -10), 'yyyy-MM-dd')]: 2,
  [format(addDays(new Date(), -11), 'yyyy-MM-dd')]: 1,
  [format(addDays(new Date(), -14), 'yyyy-MM-dd')]: 2,
  [format(addDays(new Date(), -15), 'yyyy-MM-dd')]: 0,
};

// Stable week type with ID to prevent rendering issues
interface WeekData {
  id: string;
  dates: Date[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  selectedDate,
  onDateChange,
}) => {
  const { theme } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  const flatListRef = useRef<FlatList>(null);
  
  // State to track visible weeks and if we've scrolled
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Calculate the width of one week view
  const weekWidth = screenWidth - 40;
  
  // Pre-generate a stable set of weeks
  const generateStaticWeeks = useMemo(() => {
    const today = new Date();
    const weeksData: WeekData[] = [];
    
    // Generate 12 weeks - current week and 11 past weeks
    for (let i = 11; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 0 });
      const weekDates = Array.from({ length: 7 }, (_, dayIndex) => 
        addDays(weekStart, dayIndex)
      );
      
      weeksData.push({
        id: format(weekStart, 'yyyy-MM-dd'),
        dates: weekDates
      });
    }
    
    return weeksData;
  }, []);
  
  // Initialize calendar with static weeks
  useEffect(() => {
    // Set the pre-generated weeks
    setWeeks(generateStaticWeeks);
    setIsDataReady(true);
  }, [generateStaticWeeks]);
  
  // Scroll to current week once data is ready
  useEffect(() => {
    if (isDataReady && !hasInitiallyScrolled && flatListRef.current) {
      // Need a delay to ensure the FlatList has rendered
      const scrollTimer = setTimeout(() => {
        if (flatListRef.current) {
          // Scroll to the last item (current week)
          flatListRef.current.scrollToOffset({
            offset: (weeks.length - 1) * weekWidth,
            animated: false
          });
          setHasInitiallyScrolled(true);
        }
      }, 500);
      
      return () => clearTimeout(scrollTimer);
    }
  }, [isDataReady, hasInitiallyScrolled, weeks.length, weekWidth]);
  
  // Calculate item width based on screen width to fit all 7 days
  const dayWidth = weekWidth / 7;
  
  // Render activity dots based on number of times brushed
  const renderActivityDots = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const brushCount = mockBrushingData[dateKey] || 0;
    
    // Maximum 2 dots (for morning and evening brushing)
    const maxDots = 2;
    const dots = [];
    
    for (let i = 0; i < maxDots; i++) {
      dots.push(
        <View 
          key={`dot-${i}`}
          style={[
            styles.activityDot,
            { 
              backgroundColor: i < brushCount 
                ? theme.activeColors.tint 
                : TRACK_COLOR,
              opacity: i < brushCount ? 1 : 1,
            }
          ]}
        />
      );
    }
    
    return (
      <View style={styles.dotsContainer}>
        {dots}
      </View>
    );
  };
  
  // Render each calendar day (memoized for performance)
  const renderDay = useMemo(() => {
    return (date: Date) => {
      const dayName = format(date, 'EEE').substring(0, 3);
      const dayNumber = format(date, 'd');
      const isSelected = isSameDay(selectedDate, date);
      
      return (
        <View style={[styles.dayContainer, { width: dayWidth }]}>
          {isSelected ? (
            <BlurView 
              intensity={80}
              tint={theme.colorScheme === 'dark' ? 'dark' : 'light'}
              style={[
                styles.selectedDay,
                { borderColor: theme.activeColors.border }
              ]}
            >
              <Text style={[styles.dayName, { color: theme.activeColors.text }]}>
                {dayName}
              </Text>
              <Text style={[styles.dayNumber, { 
                color: theme.activeColors.text,
                fontFamily: theme.typography.fonts.displayBold
              }]}>
                {dayNumber}
              </Text>
              {renderActivityDots(date)}
            </BlurView>
          ) : (
            <View style={styles.day}>
              <Text style={[styles.dayName, { color: theme.activeColors.textSecondary }]}>
                {dayName}
              </Text>
              <Text style={[styles.dayNumber, { 
                color: theme.activeColors.text,
                fontFamily: theme.typography.fonts.displayBold
              }]}>
                {dayNumber}
              </Text>
              {renderActivityDots(date)}
            </View>
          )}
        </View>
      );
    };
  }, [dayWidth, renderActivityDots, selectedDate, theme]);

  // Highly optimized week component to prevent unnecessary re-renders
  const WeekItem = React.memo(({ item }: { item: WeekData }) => {
    return (
      <View style={[styles.weekContainer, { width: weekWidth }]}>
        {item.dates.map((date) => (
          <View key={format(date, 'yyyy-MM-dd')} style={{ width: dayWidth }}>
            {renderDay(date)}
          </View>
        ))}
      </View>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function - only re-render if the week ID changes
    return prevProps.item.id === nextProps.item.id;
  });

  // If no weeks yet, show empty view until data loads
  if (!isDataReady) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={weeks}
        renderItem={({ item }) => <WeekItem item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={weeks.length} // Render all items initially 
        maxToRenderPerBatch={3}
        windowSize={7}
        getItemLayout={(data, index) => ({
          length: weekWidth,
          offset: weekWidth * index,
          index,
        })}
        snapToInterval={weekWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        removeClippedSubviews={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginVertical: 25,
    overflow: 'hidden',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dayContainer: {
    height: 90, // Increased height to accommodate activity dots
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
  },
  selectedDay: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 5,
  },
  dayName: {
    fontSize: 14,
    marginBottom: 5,
  },
  dayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    height: 6,
    justifyContent: 'center',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});

export default CalendarView; 