// ===== MASCOT V2 CATEGORY CONFIGURATIONS =====
// This file defines the 6 main categories and their subcases for the new robust mascot system

import type { 
  CategoryConfig, 
  GreetingCategoryType, 
  GreetingContext,
  TimeContextSubcase,
  BrushingBehaviourSubcase,
  StreakStateSubcase
} from '../types/mascot';
import { MilestoneService } from '../services/milestones';

/**
 * Helper functions for context condition checking
 */
const ContextConditions = {
  // Time-based conditions
  isMorning: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 5 && hour < 12;
  },
  
  isAfternoon: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 12 && hour < 19;
  },
  
  isEvening: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 19 && hour < 24; // 5 PM - 12 AM (midnight)
  },
  
  isLateNight: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 0 && hour < 5; // 12 AM - 5 AM
  },
  
  isWeekday: (context: GreetingContext) => {
    const day = context.dayOfWeek ?? new Date().getDay();
    return typeof day === 'string' ? 
      !['saturday', 'sunday'].includes(day) : 
      day >= 1 && day <= 5;
  },
  
  isWeekend: (context: GreetingContext) => {
    return !ContextConditions.isWeekday(context);
  },

  // Streak-based conditions
  isNewStreak: (context: GreetingContext) => (context.streakDays ?? 0) === 1,
  isAlmostWeekStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 5 && (context.streakDays ?? 0) <= 7,
  isOverTenDayStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 10,
  isBestStreakReached: async (context: GreetingContext) => {
    const currentStreak = context.streakDays ?? 0;
    const userId = context.userId || 'guest';
    
    if (currentStreak < 2) return false; // Need at least 2 days to be meaningful
    
    try {
      const comparison = await MilestoneService.getMilestoneState(
        userId, 
        currentStreak, 
        context.totalBrushCount ?? 0, 
        context.lastBrushDate
      );
      return comparison.isNewBestStreak;
    } catch (error) {
      console.error('❌ Error checking best streak milestone:', error);
      return false;
    }
  },
  isStreakBroken: (context: GreetingContext) => {
    const streakDays = context.streakDays ?? 0;
    const lastBrushDate = context.lastBrushDate;
    const totalBrushCount = context.totalBrushCount ?? 0;
    
    // Streak is broken if:
    // 1. Current streak is 0
    // 2. They have brushed before (have history)
    // 3. They have more than 1 total brush (so it's not their first time back)
    return streakDays === 0 && lastBrushDate !== undefined && totalBrushCount > 1;
  },

  // Behavior-based conditions
  isFirstBrushEver: (context: GreetingContext) => context.isFirstBrushEver === true,
  missedYesterday: (context: GreetingContext) => {
    if (!context.lastBrushDate) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return context.lastBrushDate < yesterday;
  },

  // ===== BRUSHING BEHAVIOUR CONDITIONS (Results Screen) =====
  isAfterBrushingSuccess: (context: GreetingContext) => {
    // Hit target - actualTime >= targetTime
    const actualTime = context.actualTimeInSec ?? 0;
    const targetTime = context.targetTimeInSec ?? 120; // Default 2 minutes
    return actualTime >= targetTime;
  },
  isAfterBrushingFail: (context: GreetingContext) => {
    // Under target - actualTime < targetTime
    const actualTime = context.actualTimeInSec ?? 0;
    const targetTime = context.targetTimeInSec ?? 120; // Default 2 minutes
    return actualTime > 0 && actualTime < targetTime;
  },
  isFirstBrushOfDay: (context: GreetingContext) => {
    // Will need to be determined from brushing logs - first brush today
    return context.dailyBrushCount === 1;
  },
  isSecondBrushOfDay: (context: GreetingContext) => {
    // Will need to be determined from brushing logs - second brush today
    return context.dailyBrushCount === 2;
  },
  isBrushed7of10: async (context: GreetingContext) => {
    // PROPER IMPLEMENTATION: Actually check if user brushed 7 out of the last 10 days
    const userId = context.userId;
    if (!userId || userId === 'guest') return false;
    
    try {
      // Get last 10 days of brushing data
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
      
      const { supabase } = await import('../services/supabaseClient');
      const { data: logs, error } = await supabase
        .from('brushing_logs')
        .select('date')
        .eq('user_id', userId)
        .gte('date', tenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (error || !logs) return false;

      // Count unique days with brushing
      const uniqueDays = new Set(logs.map(log => log.date));
      const daysWithBrushing = uniqueDays.size;
      
      // Return true if they brushed 7 or more out of 10 days
      return daysWithBrushing >= 7;
    } catch (error) {
      console.error('❌ Error checking 7/10 days condition:', error);
      return false;
    }
  },

  // Milestone Enhancement conditions
  isBrushCountMilestone: (context: GreetingContext) => {
    const count = context.totalBrushCount ?? 0;
    return count === 10 || count === 50 || count === 100;
  },
  isBrushCount10: (context: GreetingContext) => (context.totalBrushCount ?? 0) === 10,
  isBrushCount50: (context: GreetingContext) => (context.totalBrushCount ?? 0) === 50,
  isBrushCount100: (context: GreetingContext) => (context.totalBrushCount ?? 0) === 100,
  isMonthlyBrush20: async (context: GreetingContext) => {
    const userId = context.userId || 'guest';
    
    try {
      const milestoneState = await MilestoneService.getMilestoneState(
        userId, 
        context.streakDays ?? 0, 
        context.totalBrushCount ?? 0, 
        context.lastBrushDate
      );
      return milestoneState.hasReached20MonthlyBrushes;
    } catch (error) {
      console.error('❌ Error checking monthly brush milestone:', error);
      return false;
    }
  },
  isDay7Install: async (context: GreetingContext) => {
    try {
      const milestoneState = await MilestoneService.getMilestoneState(
        context.userId || 'guest', 
        context.streakDays ?? 0, 
        context.totalBrushCount ?? 0, 
        context.lastBrushDate
      );
      return milestoneState.isDay7;
    } catch (error) {
      console.error('❌ Error checking install date milestone:', error);
      return false;
    }
  },
  isDay30Install: async (context: GreetingContext) => {
    // PROPER IMPLEMENTATION: Actually check if user has been with app for ~30 days
    const userId = context.userId;
    if (!userId || userId === 'guest') return false;
    
    try {
      // Get user creation date from users table
      const { supabase } = await import('../services/supabaseClient');
      const { data: userData, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error || !userData) return false;

      // Calculate days since user creation
      const createdAt = new Date(userData.created_at);
      const now = new Date();
      const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      // Return true if user created account 28-32 days ago (30-day window)
      return daysSinceCreation >= 28 && daysSinceCreation <= 32;
    } catch (error) {
      console.error('❌ Error checking 30-day install milestone:', error);
      return false;
    }
  },
  isReturningUserMilestone: (context: GreetingContext) => {
    const lastBrushDate = context.lastBrushDate;
    const totalBrushCount = context.totalBrushCount ?? 0;
    
    if (!lastBrushDate || totalBrushCount <= 5) return false;
    
    // Calculate days since last brush using available data
    const daysSinceLastBrush = Math.floor(
      (new Date().getTime() - lastBrushDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Returning after 5+ day break, but has brush history
    return daysSinceLastBrush >= 5;
  },
  isMilestoneStreakRecovery: async (context: GreetingContext) => {
    // IMPROVED IMPLEMENTATION: Better detect users recovering from broken streaks
    const userId = context.userId;
    const streakDays = context.streakDays ?? 0;
    const totalBrushCount = context.totalBrushCount ?? 0;
    
    if (!userId || userId === 'guest') return false;
    
    // User is recovering if they currently have a new/small streak but have significant history
    if (streakDays >= 1 && streakDays <= 4 && totalBrushCount >= 20) {
      try {
        // Check if user had a better streak in the past (indicating they're recovering)
        const { supabase } = await import('../services/supabaseClient');
        const { data: logs, error } = await supabase
          .from('brushing_logs')
          .select('date')
          .eq('user_id', userId)
          .order('date', { ascending: true });

        if (error || !logs || logs.length < 10) return false;

        // Calculate their historical best streak
        const uniqueDates = [...new Set(logs.map(log => log.date))].sort();
        let bestHistoricalStreak = 0;
        let currentHistoricalStreak = 1;

        for (let i = 1; i < uniqueDates.length; i++) {
          const prevDate = new Date(uniqueDates[i - 1]);
          const currDate = new Date(uniqueDates[i]);
          const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            currentHistoricalStreak++;
          } else {
            bestHistoricalStreak = Math.max(bestHistoricalStreak, currentHistoricalStreak);
            currentHistoricalStreak = 1;
          }
        }
        bestHistoricalStreak = Math.max(bestHistoricalStreak, currentHistoricalStreak);

        // They're recovering if their best historical streak was significantly better than current
        return bestHistoricalStreak >= (streakDays + 5);
      } catch (error) {
        console.error('❌ Error checking streak recovery condition:', error);
        return false;
      }
    }
    
    return false;
  },

  // ===== COMMUNITY CONDITIONS =====
  isFirstWeekUser: async (context: GreetingContext) => {
    const userId = context.userId;
    
    if (!userId || userId === 'guest') return false;
    
    try {
      // Check if user signed up within the last 7 days
      const { supabase } = await import('../services/supabaseClient');
      const { data: userData, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('id', userId)
        .single();

      if (error || !userData) return false;

      const createdAt = new Date(userData.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      return daysDiff <= 7;
    } catch (error) {
      console.error('❌ Error checking first week user condition:', error);
      return false;
    }
  },
};

/**
 * Configuration for all 6 greeting categories
 */
export const GREETING_CATEGORIES: CategoryConfig[] = [
  // 1. BRUSHING BEHAVIOUR (Results Screen)
  {
    id: 'brushing_behaviour',
    name: 'Brushing Behaviour',
    description: 'Post-brushing feedback based on performance and patterns',
    baseWeight: 5.0, // Highest weight for results screen
    subcases: {
      after_brushing_success: {
        weight: 3.0, // High priority for positive reinforcement
        conditions: ContextConditions.isAfterBrushingSuccess,
      },
      after_brushing_fail: {
        weight: 3.0, // High priority for encouragement
        conditions: ContextConditions.isAfterBrushingFail,
      },
      first_brush_of_day: {
        weight: 2.0, // Good for setting daily tone
        conditions: (context: GreetingContext) =>
          ContextConditions.isFirstBrushOfDay(context) && ContextConditions.isMorning(context),
      },
      second_brush_of_day: {
        weight: 2.0, // Encourage consistency
        conditions: ContextConditions.isSecondBrushOfDay,
      },
      missed_yesterday: {
        weight: 4.0, // High priority for gentle encouragement
        conditions: ContextConditions.missedYesterday,
      },
    },
  },

  // 2. TIME CONTEXT
  {
    id: 'time_context',
    name: 'Time Context',
    description: 'Greetings based on time of day and week',
    baseWeight: 3.0, // High weight for contextual relevance
    subcases: {
      morning: {
        weight: 1.0,
        conditions: ContextConditions.isMorning,
      },
      afternoon: {
        weight: 1.0,
        conditions: ContextConditions.isAfternoon,
      },
      evening: {
        weight: 1.0,
        conditions: ContextConditions.isEvening,
      },
      late_night: {
        weight: 0.5, // Lower weight for late night brushing
        conditions: ContextConditions.isLateNight,
      },
      weekday: {
        weight: 1.0,
        conditions: ContextConditions.isWeekday,
      },
      weekend: {
        weight: 1.2, // Slightly higher for weekend vibes
        conditions: ContextConditions.isWeekend,
      },
    },
  },

  // 3. STREAK STATE
  {
    id: 'streak_state',
    name: 'Streak State',
    description: 'Greetings based on current streak status and momentum',
    baseWeight: 2.0, // ENABLED - Now implementing new_streak_starting
    subcases: {
      new_streak_starting: {
        weight: 2.0,
        conditions: ContextConditions.isNewStreak,
      },
      almost_week_streak: {
        weight: 2.5, // Higher weight for important milestone
        conditions: ContextConditions.isAlmostWeekStreak,
      },
      over_10_day_streak: {
        weight: 3.0, // Highest weight for major milestone
        conditions: ContextConditions.isOverTenDayStreak,
      },
      best_streak_reached: {
        weight: 5.0, // ENABLED - Very high weight for personal achievements
        conditions: ContextConditions.isBestStreakReached,
      },
      streak_broken: {
        weight: 4.0, // Very high weight to ensure it shows when streak is broken
        conditions: ContextConditions.isStreakBroken,
      },
    },
  },

  // 4. MILESTONE ENHANCEMENTS  
  {
    id: 'milestone_enhancements',
    name: 'Milestone Enhancements',
    description: 'Special milestone celebrations and user journey markers',
    baseWeight: 3.0, // High weight for milestone moments
    subcases: {
      brush_count_milestones: {
        weight: 4.0, // High priority for celebrating brush count milestones
        conditions: ContextConditions.isBrushCountMilestone,
        subConditions: {
          exactly_10: {
            weight: 1.0,
            conditions: ContextConditions.isBrushCount10,
          },
          exactly_50: {
            weight: 1.0,
            conditions: ContextConditions.isBrushCount50,
          },
          exactly_100: {
            weight: 1.0,
            conditions: ContextConditions.isBrushCount100,
          },
        },
      },
      monthly_brush_20: {
        weight: 4.0, // ENABLED - High priority for monthly achievements
        conditions: ContextConditions.isMonthlyBrush20,
        subConditions: {
          monthly_brush_20: {
            weight: 1.0,
            conditions: ContextConditions.isMonthlyBrush20,
          },
          brushed_7_of_10: {
            weight: 1.0,
            conditions: ContextConditions.isBrushed7of10,
          },
        },
      },
      day_7: {
        weight: 3.0, // ENABLED - Important first week milestone
        conditions: ContextConditions.isDay7Install,
        subConditions: {
          day_7: {
            weight: 1.0,
            conditions: ContextConditions.isDay7Install,
          },
          day_30: {
            weight: 1.0,
            conditions: ContextConditions.isDay30Install,
          },
        },
      },
      returning_user_milestone: {
        weight: 5.0, // Very high priority - should definitely show up - WORKING
        conditions: ContextConditions.isReturningUserMilestone,
        subConditions: {
          returning_user_milestone: {
            weight: 1.0,
            conditions: ContextConditions.isReturningUserMilestone,
          },
          milestone_streak_recovery: {
            weight: 1.0,
            conditions: ContextConditions.isMilestoneStreakRecovery,
          },
        },
      },
    },
  },

  // 5. INFORMATIVE
  {
    id: 'informative',
    name: 'Informative',
    description: 'Habit tips, dental facts, science facts, and psychology insights',
    baseWeight: 1.0, // Base weight for informative content
    subcases: {
      habit_tip: { weight: 1.0, conditions: () => true }, // Always available
      dental_fact: { weight: 1.0, conditions: () => true }, // Always available
      science_fact: { weight: 1.0, conditions: () => true }, // Always available
      psych_fact: { weight: 1.0, conditions: () => true }, // Always available
      dental_fact_2: { weight: 1.0, conditions: () => true }, // Always available
      dental_fact_3: { weight: 1.0, conditions: () => true }, // Always available
      science_fact_2: { weight: 1.0, conditions: () => true }, // Always available
      psych_fact_2: { weight: 1.0, conditions: () => true }, // Always available
      morning_breath_fact: { weight: 1.0, conditions: () => true }, // Always available
      toothpaste_fact: { weight: 1.0, conditions: () => true }, // Always available
      floss_fact: { weight: 1.0, conditions: () => true }, // Always available
      brushing_too_hard: { weight: 1.0, conditions: () => true }, // Always available
      night_brushing_importance: { 
        weight: 1.5, // Higher weight when contextually relevant
        conditions: (context: GreetingContext) => ContextConditions.isEvening(context) || ContextConditions.isLateNight(context) 
      }, // Evening and late night only
      brushing_angle_fact: { weight: 1.0, conditions: () => true }, // Always available
      dry_brush_fact: { weight: 1.0, conditions: () => true }, // Always available
    },
  },

  // 6. COMMUNITY
  {
    id: 'community',
    name: 'Community',
    description: 'Community engagement, social aspects, and shared experiences',
    baseWeight: 1.5, // Good weight for community engagement
    subcases: {
      community_brushing_now: { weight: 1.0, conditions: () => true }, // Always available
      nubo_network_energy: { weight: 1.0, conditions: () => true }, // Always available
      social_momentum: { weight: 1.0, conditions: () => true }, // Always available
      late_night_others_brushed: { 
        weight: 1.5, // Higher weight when contextually relevant
        conditions: (context: GreetingContext) => ContextConditions.isEvening(context) || ContextConditions.isLateNight(context) 
      }, // Evening and late night only
      first_week_global_wave: { weight: 2.0, conditions: ContextConditions.isFirstWeekUser }, // Higher weight for new users
      nubo_day_event: { weight: 1.0, conditions: () => true }, // Always available
      community_across_timezones: { weight: 1.0, conditions: () => true }, // Always available
      brush_in_cities: { weight: 1.0, conditions: () => true }, // Always available
      nubo_watching: { weight: 1.0, conditions: () => true }, // Always available
      nubo_broadcast: { weight: 1.0, conditions: () => true }, // Always available
    },
  },
];

/**
 * Get category configuration by ID
 */
export const getCategoryConfig = (categoryId: GreetingCategoryType): CategoryConfig | undefined => {
  return GREETING_CATEGORIES.find(cat => cat.id === categoryId);
};

/**
 * Get all available categories with non-zero weights
 */
export const getAvailableCategories = (): CategoryConfig[] => {
  return GREETING_CATEGORIES.filter(cat => cat.baseWeight > 0);
};

/**
 * Calculate total weight for a category based on context
 * Now supports async conditions
 */
export const calculateCategoryWeight = async (category: CategoryConfig, context: GreetingContext): Promise<number> => {
  let totalWeight = 0;
  
  // Check each subcase and add its weight if conditions are met
  for (const [subcaseKey, subcaseConfig] of Object.entries(category.subcases)) {
    if (subcaseConfig.weight > 0) {
      let conditionsMet = true;
      
      if (subcaseConfig.conditions) {
        const result = subcaseConfig.conditions(context);
        // Handle both sync and async conditions
        conditionsMet = result instanceof Promise ? await result : result;
      }
      
      if (conditionsMet) {
        totalWeight += subcaseConfig.weight;
      }
    }
  }
  
  return totalWeight * category.baseWeight;
}; 