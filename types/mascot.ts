// Define your PP (Profile Picture) Mascot Variants here
// Variants ending with '-pp' are considered PP versions.
export type PpMascotVariant = 
  | 'nubo-wise-1-pp'
  | 'nubo-wise-2-pp'
  | 'nubo-wise-3-pp'
  | 'nubo-welcoming-1-pp'
  | 'nubo-brushing-1-pp'
  | 'nubo-brushing-2-pp'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp'
  | 'nubo-cool-3-pp'
  | 'nubo-supportive-1-pp'
  | 'nubo-supportive-2-pp'
  | 'nubo-supportive-3-pp'
  | 'nubo-supportive-4-pp'
  | 'nubo-playful-1-pp'
  | 'nubo-playful-2-pp'
  | 'nubo-playful-3-pp'
  | 'nubo-playful-4-pp';

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'nubo-wise-1'
  | 'nubo-wise-2'
  | 'nubo-wise-3'
  | 'nubo-wise-4'
  | 'nubo-wise-5'
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-3'
  | 'nubo-welcoming-wave'
  | 'nubo-brushing-1'
  | 'nubo-brushing-2'
  | 'nubo-brushing-3'
  | 'nubo-cool-1'
  | 'nubo-cool-2'
  | 'nubo-cool-3'
  | 'nubo-cool-4'
  | 'nubo-cool-5'
  | 'nubo-supportive-1'
  | 'nubo-supportive-2'
  | 'nubo-supportive-3'
  | 'nubo-supportive-4'
  | 'nubo-supportive-5'
  | 'nubo-supportive-6'
  | 'nubo-playful-1'
  | 'nubo-playful-2'
  | 'nubo-playful-3'
  | 'nubo-playful-4'
  | 'nubo-playful-5';

// Combined type for general use, e.g., in the Mascot component itself
// This should include ALL possible mascot variants
export type MascotVariant = PpMascotVariant | NonPpMascotVariant;

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 

// ===== MASCOT CONFIGURATION =====
// Simple configuration interface for mascot cards

export interface MascotConfig {
  id: string;
  collapsedVariant: PpMascotVariant;    // Use specific PP type
  expandedVariant: NonPpMascotVariant;   // Use specific Non-PP type
  greetingTextKey: string; // Key for i18n
  probability: number; // For weighted randomness
} 

// ===== V2 TYPES (NEW ROBUST SYSTEM) =====

/**
 * The 4 core personalities that determine the tone and style of mascot interactions
 */
export type PersonalityType = 'supportive' | 'playful' | 'cool' | 'wise';

/**
 * The 11 main categories that define different contexts for mascot greetings
 */
export type GreetingCategoryType = 
  | 'time_context'        // Morning, evening, weekend, etc.
  | 'brushing_behaviour'  // First brush, missed days, consistency, etc.
  | 'streak_state'        // New streak, long streak, broken streak, etc.
  | 'milestone_enhancements' // Special milestones and user journey markers
  | 'reminder'            // Gentle nudges, motivation, encouragement
  | 'seasonal'            // Holidays, seasons, special events
  | 'mood_boost'          // Positive reinforcement, confidence building
  | 'educational'         // Tips, facts, oral health info
  | 'informative'         // Habit tips, dental facts, science facts, psychology facts
  | 'community'           // Community engagement, social aspects, shared experiences
  | 'celebration';        // Success moments, completion, victories

/**
 * Subcases for Time Context category
 */
export type TimeContextSubcase = 
  | 'morning' 
  | 'afternoon' 
  | 'evening' 
  | 'late_night' 
  | 'weekday' 
  | 'weekend';

/**
 * Subcases for Brushing Behaviour category  
 */
export type BrushingBehaviourSubcase =
  | 'after_brushing_success'
  | 'after_brushing_fail'
  | 'first_brush_of_day'
  | 'second_brush_of_day'
  | 'missed_yesterday';

/**
 * Subcases for Streak State category
 */
export type StreakStateSubcase =
  | 'new_streak_starting'
  | 'almost_week_streak'
  | 'over_10_day_streak'
  | 'best_streak_reached'
  | 'streak_broken';

/**
 * Subcases for Milestone Enhancements category
 */
export type MilestoneEnhancementsSubcase =
  | 'brush_count_milestones'
  | 'monthly_brush_20'
  | 'day_7'
  | 'returning_user_milestone';

/**
 * Subcases for Informative category
 */
export type InformativeSubcase =
  | 'habit_tip'
  | 'dental_fact'
  | 'science_fact'
  | 'psych_fact'
  | 'dental_fact_2'
  | 'dental_fact_3'
  | 'science_fact_2'
  | 'psych_fact_2'
  | 'morning_breath_fact'
  | 'toothpaste_fact'
  | 'floss_fact'
  | 'brushing_too_hard'
  | 'night_brushing_importance'
  | 'brushing_angle_fact'
  | 'dry_brush_fact';

/**
 * Subcases for Community category
 */
export type CommunitySubcase =
  | 'community_brushing_now'
  | 'nubo_network_energy'
  | 'social_momentum'
  | 'late_night_others_brushed'
  | 'first_week_global_wave'
  | 'nubo_day_event'
  | 'community_across_timezones'
  | 'brush_in_cities'
  | 'nubo_watching'
  | 'nubo_broadcast';

/**
 * Generic subcase type - can be extended as we add more categories
 */
export type GreetingSubcase = 
  | TimeContextSubcase 
  | BrushingBehaviourSubcase 
  | StreakStateSubcase
  | MilestoneEnhancementsSubcase
  | InformativeSubcase
  | CommunitySubcase
  | string; // Allow for future expansion

/**
 * Context data that can be passed to the greeting service
 */
export interface GreetingContext {
  // User identification
  userId?: string;
  
  // Auto-detected context
  currentTime?: Date;
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  
  // User behavior context
  streakDays?: number;
  lastBrushDate?: Date;
  totalBrushCount?: number;
  
  // Brushing session context (for results screen)
  actualTimeInSec?: number;
  targetTimeInSec?: number;
  dailyBrushCount?: number;
  
  // Manual overrides
  forceCategory?: GreetingCategoryType;
  forceSubcase?: GreetingSubcase;
  
  // Special flags
  isFirstBrushEver?: boolean;
  isPostAchievement?: boolean;

  // Variables for text interpolation
  variables?: {
    username?: string;
    firstName?: string;
    streakCount?: number;
    targetTime?: string;
    currentStreak?: string;
    [key: string]: string | number | undefined; // Allow custom variables
  };
}

/**
 * Configuration for a category including its subcases and probability weights
 */
export interface CategoryConfig {
  id: GreetingCategoryType;
  name: string;
  description: string;
  baseWeight: number; // Base probability weight
  subcases: {
    [subcase: string]: {
      weight: number;
      conditions?: (context: GreetingContext) => boolean | Promise<boolean>; // Optional condition checker (sync or async)
      subConditions?: {
        [subCondition: string]: {
          weight: number;
          conditions?: (context: GreetingContext) => boolean | Promise<boolean>;
        };
      };
    };
  };
}

/**
 * Complete greeting configuration combining personality + category + subcase
 */
export interface GreetingTextConfig {
  personality: PersonalityType;
  category: GreetingCategoryType;
  subcase: GreetingSubcase;
  textKey: string; // Key for i18n lookup
  weight: number; // Probability weight for this specific text
}

/**
 * Visual configuration mapping personalities to mascot variants
 */
export interface PersonalityVisualConfig {
  personality: PersonalityType;
  collapsedVariant: PpMascotVariant;
  expandedVariant: NonPpMascotVariant;
  description?: string;
}

/**
 * Main result returned by the greeting service
 */
export interface MascotGreetingResult {
  textKey: string;
  actualText: string; // Translated text
  personality: PersonalityType;
  category: GreetingCategoryType;
  subcase: GreetingSubcase;
  subCondition?: string; // Optional sub-condition for nested categories
  visualConfig: {
    collapsedVariant: PpMascotVariant;
    expandedVariant: NonPpMascotVariant;
  };
}

/**
 * Service interface for the new mascot greeting system
 */
export interface IMascotGreetingService {
  /**
   * Get a contextual greeting based on personality and current context
   */
  getGreeting(personality: PersonalityType, context?: GreetingContext): Promise<MascotGreetingResult>;
  
  /**
   * Get visual configuration for a personality
   */
  getVisualConfig(personality: PersonalityType): PersonalityVisualConfig;
  
  /**
   * Get available categories and their configurations
   */
  getAvailableCategories(): CategoryConfig[];
  
  /**
   * Detect context automatically from current state
   */
  detectContext(userState?: any): GreetingContext;
} 