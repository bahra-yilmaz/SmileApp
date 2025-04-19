import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { BlurView } from 'expo-blur';

// Import the track color from DonutChart
const TRACK_COLOR = 'rgba(200, 200, 220, 0.3)';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
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
};

const CalendarView: React.FC<CalendarViewProps> = ({ 
  selectedDate,
  onDateChange,
}) => {
  const { theme } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  
  // Get start of the current week (Sunday)
  const startOfCurrentWeek = startOfWeek(new Date(), { weekStartsOn: 0 });
  
  // Generate dates for the current week (Sunday to Saturday)
  const dates = Array.from({ length: 7 }, (_, i) => {
    return addDays(startOfCurrentWeek, i);
  });
  
  // Calculate item width based on screen width to fit all 7 days
  const dayWidth = (screenWidth - 40) / 7; // Account for container padding
  
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
  
  // Render each calendar day
  const renderDay = ({ item }: { item: Date }) => {
    const dayName = format(item, 'EEE').substring(0, 3);
    const dayNumber = format(item, 'd');
    const isSelected = isSameDay(selectedDate, item);
    
    return (
      <TouchableOpacity
        onPress={() => onDateChange(item)}
        style={[styles.dayContainer, { width: dayWidth }]}
      >
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
            {renderActivityDots(item)}
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
            {renderActivityDots(item)}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={dates}
        renderItem={renderDay}
        keyExtractor={(item) => format(item, 'yyyy-MM-dd')}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContainer,
          { justifyContent: 'space-between', width: screenWidth - 40 }
        ]}
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
  listContainer: {
    paddingVertical: 10,
    paddingHorizontal: 0,
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