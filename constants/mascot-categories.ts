// ===== MASCOT V2 CATEGORY CONFIGURATIONS =====
// This file defines the 9 main categories and their subcases for the new robust mascot system

import type { 
  CategoryConfig, 
  GreetingCategoryType, 
  GreetingContext,
  TimeContextSubcase,
  BrushingBehaviourSubcase,
  StreakStateSubcase
} from '../types/mascot';

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
    return hour >= 12 && hour < 17;
  },
  
  isEvening: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 17 && hour < 22;
  },
  
  isLateNight: (context: GreetingContext) => {
    const hour = context.currentTime?.getHours() ?? new Date().getHours();
    return hour >= 22 || hour < 5;
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
  isNewStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 1 && (context.streakDays ?? 0) <= 3,
  isShortStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 1 && (context.streakDays ?? 0) <= 7,
  isMediumStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 8 && (context.streakDays ?? 0) <= 30,
  isLongStreak: (context: GreetingContext) => (context.streakDays ?? 0) >= 31,
  isStreakBroken: (context: GreetingContext) => (context.streakDays ?? 0) === 0 && (context.lastBrushDate !== undefined),

  // Behavior-based conditions
  isFirstBrushEver: (context: GreetingContext) => context.isFirstBrushEver === true,
  missedYesterday: (context: GreetingContext) => {
    if (!context.lastBrushDate) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return context.lastBrushDate < yesterday;
  },
};

/**
 * Configuration for all 9 greeting categories
 */
export const GREETING_CATEGORIES: CategoryConfig[] = [
  // 1. TIME CONTEXT
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

  // 2. BRUSHING BEHAVIOUR
  {
    id: 'brushing_behaviour',
    name: 'Brushing Behaviour',
    description: 'Greetings based on user brushing patterns and consistency',
    baseWeight: 2.5, // High relevance for behavior reinforcement
    subcases: {
      first_brush_ever: {
        weight: 5.0, // Very high weight for special moment
        conditions: ContextConditions.isFirstBrushEver,
      },
      consistent_habit: {
        weight: 1.5,
        conditions: (context) => (context.streakDays ?? 0) >= 7,
      },
      missed_yesterday: {
        weight: 2.0, // Higher weight for gentle encouragement
        conditions: ContextConditions.missedYesterday,
      },
      back_after_break: {
        weight: 2.0,
        conditions: (context) => ContextConditions.missedYesterday(context) && (context.totalBrushCount ?? 0) > 5,
      },
      perfect_week: {
        weight: 2.0,
        conditions: (context) => (context.streakDays ?? 0) >= 7 && (context.streakDays ?? 0) % 7 === 0,
      },
      struggling_consistency: {
        weight: 1.5,
        conditions: (context) => (context.streakDays ?? 0) < 3 && (context.totalBrushCount ?? 0) > 10,
      },
    },
  },

  // 3. STREAK STATE
  {
    id: 'streak_state',
    name: 'Streak State',
    description: 'Greetings based on current streak status and momentum',
    baseWeight: 2.0, // Important for motivation
    subcases: {
      new_streak_starting: {
        weight: 2.0,
        conditions: ContextConditions.isNewStreak,
      },
      short_streak_1_7: {
        weight: 1.5,
        conditions: ContextConditions.isShortStreak,
      },
      medium_streak_8_30: {
        weight: 1.5,
        conditions: ContextConditions.isMediumStreak,
      },
      long_streak_31_plus: {
        weight: 2.0, // Celebrate achievements
        conditions: ContextConditions.isLongStreak,
      },
      streak_broken: {
        weight: 2.5, // Higher weight for recovery support
        conditions: ContextConditions.isStreakBroken,
      },
      streak_recovery: {
        weight: 2.0,
        conditions: (context) => (context.streakDays ?? 0) >= 1 && ContextConditions.isStreakBroken(context),
      },
    },
  },

  // 4. ACHIEVEMENT  
  {
    id: 'achievement',
    name: 'Achievement',
    description: 'Greetings for milestones, goals, and accomplishments',
    baseWeight: 1.5, // Moderate weight, triggered by specific events
    subcases: {
      goal_reached: { weight: 0, conditions: () => false }, // TODO: Implement when achievement system is ready
      milestone_hit: { weight: 0, conditions: () => false },
      personal_best: { weight: 0, conditions: () => false },
      consistency_badge: { weight: 0, conditions: () => false },
      improvement_noted: { weight: 0, conditions: () => false },
      target_exceeded: { weight: 0, conditions: () => false },
    },
  },

  // 5. REMINDER
  {
    id: 'reminder',
    name: 'Reminder',
    description: 'Gentle nudges and motivational messages',
    baseWeight: 1.0, // Base level for general motivation
    subcases: {
      gentle_nudge: { weight: 0, conditions: () => false }, // TODO: Implement
      motivation_boost: { weight: 0, conditions: () => false },
      habit_reinforcement: { weight: 0, conditions: () => false },
      positive_reminder: { weight: 0, conditions: () => false },
      encouragement: { weight: 0, conditions: () => false },
      persistence_message: { weight: 0, conditions: () => false },
    },
  },

  // 6. SEASONAL
  {
    id: 'seasonal',
    name: 'Seasonal',
    description: 'Holiday and seasonal themed greetings',
    baseWeight: 0.5, // Lower weight, special occasions only
    subcases: {
      new_year: { weight: 0, conditions: () => false }, // TODO: Implement seasonal detection
      valentine_day: { weight: 0, conditions: () => false },
      spring_cleaning: { weight: 0, conditions: () => false },
      summer_fresh: { weight: 0, conditions: () => false },
      back_to_school: { weight: 0, conditions: () => false },
      holiday_spirit: { weight: 0, conditions: () => false },
    },
  },

  // 7. MOOD BOOST
  {
    id: 'mood_boost',
    name: 'Mood Boost',
    description: 'Positive reinforcement and confidence building messages',
    baseWeight: 1.2, // Slightly higher for positive vibes
    subcases: {
      confidence_builder: { weight: 0, conditions: () => false }, // TODO: Implement
      positive_affirmation: { weight: 0, conditions: () => false },
      smile_compliment: { weight: 0, conditions: () => false },
      energy_booster: { weight: 0, conditions: () => false },
      self_care_praise: { weight: 0, conditions: () => false },
      progress_celebration: { weight: 0, conditions: () => false },
    },
  },

  // 8. EDUCATIONAL
  {
    id: 'educational',
    name: 'Educational',
    description: 'Oral health tips, facts, and educational content',
    baseWeight: 0.8, // Lower weight, more informational
    subcases: {
      brushing_tip: { weight: 0, conditions: () => false }, // TODO: Implement
      oral_health_fact: { weight: 0, conditions: () => false },
      technique_advice: { weight: 0, conditions: () => false },
      product_suggestion: { weight: 0, conditions: () => false },
      health_benefit: { weight: 0, conditions: () => false },
      prevention_tip: { weight: 0, conditions: () => false },
    },
  },

  // 9. CELEBRATION
  {
    id: 'celebration',
    name: 'Celebration',
    description: 'Success moments, completions, and victory messages',
    baseWeight: 1.8, // Higher weight for positive reinforcement
    subcases: {
      session_complete: { weight: 0, conditions: () => false }, // TODO: Implement
      perfect_timing: { weight: 0, conditions: () => false },
      consistency_win: { weight: 0, conditions: () => false },
      improvement_noted: { weight: 0, conditions: () => false },
      milestone_party: { weight: 0, conditions: () => false },
      success_moment: { weight: 0, conditions: () => false },
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
 */
export const calculateCategoryWeight = (category: CategoryConfig, context: GreetingContext): number => {
  let totalWeight = 0;
  
  // Check each subcase and add its weight if conditions are met
  for (const [subcaseKey, subcaseConfig] of Object.entries(category.subcases)) {
    if (subcaseConfig.weight > 0) {
      const conditionsMet = subcaseConfig.conditions ? subcaseConfig.conditions(context) : true;
      if (conditionsMet) {
        totalWeight += subcaseConfig.weight;
      }
    }
  }
  
  return totalWeight * category.baseWeight;
}; 