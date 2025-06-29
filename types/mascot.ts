// Define your PP (Profile Picture) Mascot Variants here
// Variants ending with '-pp' are considered PP versions.
export type PpMascotVariant = 
  | 'nubo-wise-1-pp'
  | 'nubo-welcoming-1-pp'
  | 'nubo-brushing-1-pp'
  | 'nubo-brushing-2-pp'
  | 'nubo-cool-3-pp'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp';

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'nubo-wise-1'
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-brushing-1'
  | 'nubo-brushing-2'
  | 'nubo-brushing-3'
  | 'nubo-cool-2'
  | 'nubo-cool-1'
  | 'nubo-cool-3'
  | 'nubo-cool-4'
  | 'nubo-cool-5';

// Combined type for general use, e.g., in the Mascot component itself
export type MascotVariant = 
  | 'nubo-welcoming-1'
  | 'nubo-happy-1'
  | 'nubo-daily-brush-1'
  | 'nubo-success-1'
  | 'nubo-sad-1'
  | 'nubo-bag-1';

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 

// ===== V1 TYPES (DEPRECATED) =====
// Keep these for backward compatibility during transition

// Added MascotProfile interface
export interface MascotProfile {
  id: string;
  profilePictureVariant: PpMascotVariant; // Uses existing type for profile pictures
  poseVariant: NonPpMascotVariant;       // Uses existing type for poses/expanded states
  greetings: string[];                  // Array of possible texts for this profile
  // Optional: Consider adding mascotPosition?: MascotPositioning; if it should be tied to the profile
} 

// Added MascotConfig interface (moved from constants/mascotConfig.ts)
export interface MascotConfig {
  id: string;
  collapsedVariant: PpMascotVariant;    // Use specific PP type
  expandedVariant: NonPpMascotVariant;   // Use specific Non-PP type
  greetingTextKey: string; // Key for i18n
  probability: number; // For weighted randomness
} 

// NEW Interface for defining dynamic themes
export interface DynamicMascotTheme {
  themeId: string; // e.g., 'cool', 'wise', 'friendly'
  profilePictureVariants: PpMascotVariant[]; // Pool of PPs for this theme
  poseVariants: NonPpMascotVariant[];       // Pool of poses for this theme
  greetingTextKeys: string[];               // Pool of greeting text keys for this theme
  selectionWeight: number; 
} 

// ===== V2 TYPES (NEW ROBUST SYSTEM) =====

/**
 * The 4 core personalities that determine the tone and style of mascot interactions
 */
export type PersonalityType = 'supportive' | 'playful' | 'cool' | 'wise';

/**
 * The 9 main categories that define different contexts for mascot greetings
 */
export type GreetingCategoryType = 
  | 'time_context'        // Morning, evening, weekend, etc.
  | 'brushing_behaviour'  // First brush, missed days, consistency, etc.
  | 'streak_state'        // New streak, long streak, broken streak, etc.
  | 'achievement'         // Goals reached, milestones, personal bests
  | 'reminder'            // Gentle nudges, motivation, encouragement
  | 'seasonal'            // Holidays, seasons, special events
  | 'mood_boost'          // Positive reinforcement, confidence building
  | 'educational'         // Tips, facts, oral health info
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
  | 'first_brush_ever'
  | 'consistent_habit'
  | 'missed_yesterday'
  | 'back_after_break'
  | 'perfect_week'
  | 'struggling_consistency';

/**
 * Subcases for Streak State category
 */
export type StreakStateSubcase =
  | 'new_streak_starting'
  | 'short_streak_1_7'
  | 'medium_streak_8_30'
  | 'long_streak_31_plus'
  | 'streak_broken'
  | 'streak_recovery';

/**
 * Generic subcase type - can be extended as we add more categories
 */
export type GreetingSubcase = 
  | TimeContextSubcase 
  | BrushingBehaviourSubcase 
  | StreakStateSubcase
  | string; // Allow for future expansion

/**
 * Context data that can be passed to the greeting service
 */
export interface GreetingContext {
  // Auto-detected context
  currentTime?: Date;
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  
  // User behavior context
  streakDays?: number;
  lastBrushDate?: Date;
  totalBrushCount?: number;
  
  // Manual overrides
  forceCategory?: GreetingCategoryType;
  forceSubcase?: GreetingSubcase;
  
  // Special flags
  isFirstBrushEver?: boolean;
  isPostAchievement?: boolean;
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
      conditions?: (context: GreetingContext) => boolean; // Optional condition checker
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