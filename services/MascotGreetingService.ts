// ===== MASCOT V2 GREETING SERVICE =====
// Main service for the new robust mascot greeting system

import { useTranslation } from 'react-i18next';
import type {
  PersonalityType,
  GreetingCategoryType,
  GreetingContext,
  GreetingSubcase,
  MascotGreetingResult,
  PersonalityVisualConfig,
  CategoryConfig,
  IMascotGreetingService,
  PpMascotVariant,
  NonPpMascotVariant,
} from '../types/mascot';

import {
  GREETING_CATEGORIES,
  getCategoryConfig,
  getAvailableCategories,
  calculateCategoryWeight,
} from '../constants/mascot-categories';

/**
 * Visual configurations mapping personalities to mascot variants
 */
const PERSONALITY_VISUAL_CONFIGS: Record<PersonalityType, PersonalityVisualConfig> = {
  supportive: {
    personality: 'supportive',
    collapsedVariant: 'nubo-welcoming-1-pp',
    expandedVariant: 'nubo-welcoming-1',
    description: 'Warm and encouraging visual style',
  },
  playful: {
    personality: 'playful',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-wave',
    description: 'Fun and energetic visual style',
  },
  cool: {
    personality: 'cool',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-cool-3',
    description: 'Confident and stylish visual style',
  },
  wise: {
    personality: 'wise',
    collapsedVariant: 'nubo-wise-1-pp',
    expandedVariant: 'nubo-wise-1',
    description: 'Thoughtful and calm visual style',
  },
};

/**
 * Fallback text keys for when specific category/subcase combinations don't have texts yet
 */
const FALLBACK_TEXT_KEYS: Record<PersonalityType, string> = {
  supportive: 'mascotGreetings.supportive.fallback',
  playful: 'mascotGreetings.playful.fallback',
  cool: 'mascotGreetings.cool.fallback',
  wise: 'mascotGreetings.wise.fallback',
};

/**
 * Context detection utilities
 */
export class ContextDetector {
  static detectTimeContext(currentTime?: Date): Partial<GreetingContext> {
    const now = currentTime || new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    return {
      currentTime: now,
      dayOfWeek: dayNames[now.getDay()] as any,
    };
  }

  static detectFullContext(userState?: {
    userId?: string;
    streakDays?: number;
    lastBrushDate?: Date;
    totalBrushCount?: number;
    isFirstBrushEver?: boolean;
  }): GreetingContext {
    const timeContext = this.detectTimeContext();
    
    return {
      ...timeContext,
      userId: userState?.userId,
      streakDays: userState?.streakDays,
      lastBrushDate: userState?.lastBrushDate,
      totalBrushCount: userState?.totalBrushCount,
      isFirstBrushEver: userState?.isFirstBrushEver,
    };
  }
}

/**
 * Weighted random selection utility
 */
class WeightedSelector {
  static selectByWeight<T>(items: Array<{ item: T; weight: number }>): T | null {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    
    if (totalWeight === 0) return null;
    
    let randomPoint = Math.random() * totalWeight;
    
    for (const { item, weight } of items) {
      randomPoint -= weight;
      if (randomPoint <= 0) {
        return item;
      }
    }
    
    // Fallback to first item (shouldn't happen)
    return items[0]?.item || null;
  }
}

/**
 * Main Mascot Greeting Service Implementation
 */
export class MascotGreetingService implements IMascotGreetingService {
  private t: (key: string, options?: any) => string;

  constructor() {
    // Note: In a React component, you'd get this from useTranslation()
    // This is a placeholder for the service layer
    this.t = (key: string) => key; // Return key as fallback
  }

  /**
   * Set translation function (called from React components)
   */
  setTranslationFunction(t: (key: string, options?: any) => string): void {
    this.t = t;
  }

  /**
   * Get a contextual greeting based on personality and current context
   */
  async getGreeting(
    personality: PersonalityType,
    context?: GreetingContext
  ): Promise<MascotGreetingResult> {
    // Detect context if not provided
    const finalContext = context || ContextDetector.detectFullContext();

    // Select category based on context and weights (now async)
    const selectedCategory = await this.selectCategory(finalContext);
    
    // Select subcase within the category (now async, returns object)
    const subcaseSelection = await this.selectSubcase(selectedCategory, finalContext);
    
    // Generate text key and get translated text with variables
    const textKey = this.generateTextKey(personality, selectedCategory.id, subcaseSelection.subcase, subcaseSelection.subCondition);
    const actualText = this.getTranslatedText(textKey, personality, finalContext.variables);
    
    // Get visual configuration
    const visualConfig = this.getVisualConfig(personality);

    return {
      textKey,
      actualText,
      personality,
      category: selectedCategory.id,
      subcase: subcaseSelection.subcase,
      subCondition: subcaseSelection.subCondition,
      visualConfig: {
        collapsedVariant: visualConfig.collapsedVariant,
        expandedVariant: visualConfig.expandedVariant,
      },
    };
  }

  /**
   * Get visual configuration for a personality
   */
  getVisualConfig(personality: PersonalityType): PersonalityVisualConfig {
    return PERSONALITY_VISUAL_CONFIGS[personality];
  }

  /**
   * Get available categories and their configurations
   */
  getAvailableCategories(): CategoryConfig[] {
    return getAvailableCategories();
  }

  /**
   * Detect context automatically from current state
   */
  detectContext(userState?: any): GreetingContext {
    return ContextDetector.detectFullContext(userState);
  }

  /**
   * Select a category based on context and weights
   */
  private async selectCategory(context: GreetingContext): Promise<CategoryConfig> {
    const availableCategories = getAvailableCategories();
    
    // Handle forced category
    if (context.forceCategory) {
      const forcedCategory = getCategoryConfig(context.forceCategory);
      if (forcedCategory) return forcedCategory;
    }

    // Calculate weights for each category (now async)
    const weightPromises = availableCategories.map(async category => ({
      item: category,
      weight: await calculateCategoryWeight(category, context),
    }));
    
    const weightedCategories = (await Promise.all(weightPromises))
      .filter(item => item.weight > 0);

    // Select based on weights
    const selected = WeightedSelector.selectByWeight(weightedCategories);
    
    // Fallback to first available category
    return selected || availableCategories[0];
  }

  /**
   * Select a subcase within a category
   */
  private async selectSubcase(category: CategoryConfig, context: GreetingContext): Promise<{ subcase: GreetingSubcase; subCondition?: string }> {
    // Handle forced subcase
    if (context.forceSubcase) {
      return { subcase: context.forceSubcase };
    }

    // Get available subcases with weights (now handling async conditions)
    const subcasePromises = Object.entries(category.subcases)
      .map(async ([subcaseKey, subcaseConfig]) => {
        // Check weight first
        if (subcaseConfig.weight === 0) return null;
        
        // Check conditions (can be async now)
        let conditionsMet = true;
        if (subcaseConfig.conditions) {
          const result = subcaseConfig.conditions(context);
          conditionsMet = result instanceof Promise ? await result : result;
        }
        
        if (!conditionsMet) return null;
        
        return {
          item: subcaseKey as GreetingSubcase,
          weight: subcaseConfig.weight,
          config: subcaseConfig,
        };
      });
    
    const availableSubcases = (await Promise.all(subcasePromises))
      .filter((item): item is { item: GreetingSubcase; weight: number; config: any } => item !== null);

    // Select based on weights
    const selectedSubcase = WeightedSelector.selectByWeight(availableSubcases);
    
    if (!selectedSubcase) {
      // Fallback to first available subcase
      const firstAvailable = Object.keys(category.subcases)[0] as GreetingSubcase;
      return { subcase: firstAvailable };
    }

    // Find the full configuration for the selected subcase
    const selectedConfig = category.subcases[selectedSubcase];
    
    // Check if selected subcase has sub-conditions
    if (selectedConfig?.subConditions) {
      const subCondition = await this.selectSubCondition(selectedConfig.subConditions, context);
      return { subcase: selectedSubcase, subCondition };
    }

    return { subcase: selectedSubcase };
  }

  /**
   * Select a sub-condition within a subcase
   */
  private async selectSubCondition(subConditions: Record<string, any>, context: GreetingContext): Promise<string | undefined> {
    const subConditionPromises = Object.entries(subConditions)
      .map(async ([subConditionKey, subConditionConfig]) => {
        // Check weight first
        if (subConditionConfig.weight === 0) return null;
        
        // Check conditions (can be async)
        let conditionsMet = true;
        if (subConditionConfig.conditions) {
          const result = subConditionConfig.conditions(context);
          conditionsMet = result instanceof Promise ? await result : result;
        }
        
        if (!conditionsMet) return null;
        
        return {
          item: subConditionKey,
          weight: subConditionConfig.weight,
        };
      });
    
    const availableSubConditions = (await Promise.all(subConditionPromises))
      .filter((item): item is { item: string; weight: number } => item !== null);

    // Select based on weights
    const selected = WeightedSelector.selectByWeight(availableSubConditions);
    
    return selected || Object.keys(subConditions)[0];
  }

  /**
   * Generate text key for i18n lookup
   */
  private generateTextKey(
    personality: PersonalityType,
    category: GreetingCategoryType,
    subcase: GreetingSubcase,
    subCondition?: string
  ): string {
    if (subCondition) {
      // For sub-conditions, use single text (no variant)
      return `mascotGreetings.v2.${personality}.${category}.${subcase}.${subCondition}`;
    }
    
    // Generate random variant (1, 2, or 3) for regular subcases
    const variant = Math.floor(Math.random() * 3) + 1;
    
    return `mascotGreetings.v2.${personality}.${category}.${subcase}.${variant}`;
  }

  /**
   * Get translated text with fallback handling and variable interpolation
   */
  private getTranslatedText(textKey: string, personality: PersonalityType, variables?: Record<string, string | number | undefined>): string {
    const translatedText = this.t(textKey);
    
    // If translation key is returned unchanged, use fallback
    if (translatedText === textKey) {
      const fallbackKey = FALLBACK_TEXT_KEYS[personality];
      const fallbackText = this.t(fallbackKey);
      
      // If even fallback fails, return a hardcoded message
      if (fallbackText === fallbackKey) {
        return this.interpolateVariables(this.getHardcodedFallback(personality), variables);
      }
      
      return this.interpolateVariables(fallbackText, variables);
    }
    
    return this.interpolateVariables(translatedText, variables);
  }

  /**
   * Interpolate variables in text (e.g., {{username}} -> "John")
   */
  private interpolateVariables(text: string, variables?: Record<string, string | number | undefined>): string {
    if (!variables) return text;
    
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = variables[variableName];
      return value !== undefined ? String(value) : match; // Keep original if variable not found
    });
  }

  /**
   * Get hardcoded fallback text (last resort)
   */
  private getHardcodedFallback(personality: PersonalityType): string {
    const fallbacks: Record<PersonalityType, string> = {
      supportive: "You're doing great! Let's keep up the good work.",
      playful: "Time to sparkle and shine! Let's brush away the day!",
      cool: "Looking sharp starts with sharp habits. Let's go.",
      wise: "Small consistent actions lead to lasting results. Let's begin.",
    };
    
    return fallbacks[personality];
  }
}

/**
 * Singleton instance for use throughout the app
 */
export const mascotGreetingService = new MascotGreetingService();

/**
 * React hook for using the mascot greeting service with translation
 * Note: Import { useTranslation } from 'react-i18next' in your React component
 */
export const useMascotGreetingService = (t?: (key: string, options?: any) => string): IMascotGreetingService => {
  // If translation function provided, use it
  if (t) {
    mascotGreetingService.setTranslationFunction(t);
  }
  
  return mascotGreetingService;
}; 