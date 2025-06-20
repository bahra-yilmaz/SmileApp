import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme } from '../ThemeProvider';
import { format, startOfWeek, addDays, isSameDay, subWeeks, parse } from 'date-fns';
import { enUS, es, de, fr, tr, pt, ja, hi } from 'date-fns/locale'; // Import locales
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { BlurView } from 'expo-blur';
import { useCalendarData } from '../../hooks/useCalendarData';

// Import the track color from DonutChart
const TRACK_COLOR = 'rgba(200, 200, 220, 0.3)';

interface CalendarViewProps {
  selectedDate: Date;
  onDateChange?: (date: Date) => void; // Made optional since we're disabling selection
}



// Stable week type with ID to prevent rendering issues
interface WeekData {
  id: string;
  dates: Date[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  selectedDate,
  onDateChange,
}) => {
  const { t, i18n } = useTranslation(); // Get i18n instance
  const { theme } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');
  const flatListRef = useRef<FlatList>(null);
  
  // Fetch real brushing data
  const { brushingData, isLoading: isDataLoading } = useCalendarData();
  
  // State to track visible weeks and if we're ready to display
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Map app language codes to date-fns locales
  const dateFnsLocales = useMemo(() => ({
    en: enUS,
    es: es,
    de: de,
    fr: fr,
    tr: tr, // Add Turkish locale
    pt: pt, // Add Portuguese locale
    ja: ja, // Add Japanese locale
    hi: hi, // Add Hindi locale
    // Add other mappings as needed
  }), []);

  const currentLngCode = i18n.language.split('-')[0];
  const currentLocale = dateFnsLocales[currentLngCode as keyof typeof dateFnsLocales] || enUS;

  // Calculate the width of one week view
  const weekWidth = screenWidth - 40;
  const dayWidth = weekWidth / 7;
  
  // Generate weeks data
  const generateWeeks = () => {
    // Fix the date at initialization time to prevent rerendering issues
    const today = new Date();
    const formattedToday = format(today, 'yyyy-MM-dd', { locale: currentLocale });
    const fixedToday = parse(formattedToday, 'yyyy-MM-dd', new Date(), { locale: currentLocale });
    
    const weeksData: WeekData[] = [];
    
    // Only generate 5 weeks - current week and 4 past weeks
    for (let i = 4; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(fixedToday, i), { weekStartsOn: 0, locale: currentLocale });
      const formattedWeekStart = format(weekStart, 'yyyy-MM-dd', { locale: currentLocale });
      
      // Create dates array with consistent formatting
      const weekDates = Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(weekStart, dayIndex);
        const formattedDate = format(date, 'yyyy-MM-dd', { locale: currentLocale });
        return parse(formattedDate, 'yyyy-MM-dd', new Date(), { locale: currentLocale });
      });
      
      weeksData.push({
        id: formattedWeekStart,
        dates: weekDates,
      });
    }
    
    return weeksData;
  };
  
  // Initialize calendar with weeks
  useEffect(() => {
    // Generate weeks
    const weeksData = generateWeeks();
    setWeeks(weeksData);
    
    // Force display after a short time even if scrolling fails
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // Simple timeout to let FlatList render before trying to scroll
    setTimeout(() => {
      if (flatListRef.current) {
        // Scroll to the last item (current week)
        try {
          flatListRef.current.scrollToEnd({ animated: false });
        } catch (e) {
          console.log('Error scrolling to end:', e);
        }
      }
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(safetyTimer);
  }, []);
  
  // Render activity dots based on number of times brushed
  const renderActivityDots = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd', { locale: currentLocale });
    const brushCount = brushingData[dateKey] || 0;
    
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
  
  // Day renderer component for better performance
  const DayComponent = React.memo(({ date }: { date: Date }) => {
    const dayName = format(date, 'EEE', { locale: currentLocale }).substring(0, 3);
    const dayNumber = format(date, 'd', { locale: currentLocale });
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
  });

  // Week component with its own memo
  const WeekComponent = React.memo(({ item }: { item: WeekData }) => {
    return (
      <View style={[styles.weekContainer, { width: weekWidth }]}>
        {item.dates.map((date) => (
          <DayComponent 
            key={format(date, 'yyyy-MM-dd', { locale: currentLocale })} 
            date={date} 
          />
        ))}
      </View>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if the week ID changes
    return prevProps.item.id === nextProps.item.id;
  });

  // Show loading indicator while initializing
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="small" color={theme.activeColors.tint} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={weeks}
        renderItem={({ item }) => <WeekComponent item={item} />}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialNumToRender={weeks.length}
        windowSize={5}
        getItemLayout={(data, index) => ({
          length: weekWidth,
          offset: weekWidth * index,
          index,
        })}
        snapToInterval={weekWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        scrollEventThrottle={16}
        removeClippedSubviews={false}
        initialScrollIndex={weeks.length - 1}
        onScrollToIndexFailed={() => {
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }, 200);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 0,
    marginVertical: 25,
    overflow: 'hidden',
    minHeight: 110, // Minimum height to prevent layout shift
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  dayContainer: {
    height: 90,
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