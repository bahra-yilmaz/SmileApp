import { STREAK_PHASES, StreakPhase } from './StreakConfig';
import { StreakDisplayInfo } from './StreakTypes';

/**
 * Handles all UI display logic for streak information
 */
export class StreakDisplayService {

  /**
   * Get the appropriate streak phase based on streak days
   */
  static getStreakPhase(streakDays: number): StreakPhase {
    for (const [phase, range] of Object.entries(STREAK_PHASES)) {
      if (streakDays >= range.min && streakDays <= range.max) {
        return phase as StreakPhase;
      }
    }
    return 'LEGENDARY'; // Default for very high streaks
  }

  /**
   * Get localization key for keep going title based on streak phase
   */
  static getKeepGoingTitleKey(streakDays: number): string {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToKeyMap: Record<StreakPhase, string> = {
      START: 'streakOverlay.keepGoingTitleStart',
      FIRST: 'streakOverlay.keepGoingTitleFirst',
      EARLY: 'streakOverlay.keepGoingTitleEarly',
      WEEK: 'streakOverlay.keepGoingTitleWeek',
      TWO_WEEKS: 'streakOverlay.keepGoingTitleTwoWeeks',
      MONTH: 'streakOverlay.keepGoingTitleMonth',
      TWO_MONTHS: 'streakOverlay.keepGoingTitleTwoMonths',
      HUNDRED: 'streakOverlay.keepGoingTitleHundred',
      LEGENDARY: 'streakOverlay.keepGoingTitleLegendary',
    };

    return phaseToKeyMap[phase];
  }

  /**
   * Get default title text for keep going section (fallback when translation fails)
   */
  static getKeepGoingDefaultTitle(streakDays: number): string {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToTitleMap: Record<StreakPhase, string> = {
      START: 'Start Your Journey!',
      FIRST: 'Great Start!',
      EARLY: 'Building Momentum!',
      WEEK: 'One Week Strong!',
      TWO_WEEKS: 'Two Weeks Champion!',
      MONTH: 'Monthly Master!',
      TWO_MONTHS: 'Habit Hero!',
      HUNDRED: 'Century Achiever!',
      LEGENDARY: 'Legendary Keeper!',
    };

    return phaseToTitleMap[phase];
  }

  /**
   * Get motivational level for the current streak
   */
  static getMotivationalLevel(streakDays: number): StreakDisplayInfo['motivationalLevel'] {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToLevelMap: Record<StreakPhase, StreakDisplayInfo['motivationalLevel']> = {
      START: 'start',
      FIRST: 'building',
      EARLY: 'building',
      WEEK: 'strong',
      TWO_WEEKS: 'champion',
      MONTH: 'master',
      TWO_MONTHS: 'master',
      HUNDRED: 'legendary',
      LEGENDARY: 'legendary',
    };

    return phaseToLevelMap[phase];
  }

  /**
   * Get complete display information for a streak
   */
  static getStreakDisplayInfo(
    streakDays: number, 
    totalBrushings: number,
    t: (key: string, options?: any) => string
  ): StreakDisplayInfo {
    const phase = this.getStreakPhase(streakDays);
    const titleKey = this.getKeepGoingTitleKey(streakDays);
    const defaultTitle = this.getKeepGoingDefaultTitle(streakDays);
    
    return {
      title: t(titleKey, { defaultValue: defaultTitle }),
      description: t('streakOverlay.currentStreakBrushingsText', {
        count: totalBrushings,
        days: streakDays,
        defaultValue: `${totalBrushings} brushing sessions in your ${streakDays}-day streak`
      }),
      phase: phase.toLowerCase(),
      motivationalLevel: this.getMotivationalLevel(streakDays)
    };
  }

  /**
   * Format streak duration text
   */
  static formatStreakDuration(days: number, t: (key: string, options?: any) => string): string {
    if (days === 0) return t('streakOverlay.noStreak', { defaultValue: 'No streak yet' });
    if (days === 1) return t('streakOverlay.oneDay', { defaultValue: '1 day' });
    return t('streakOverlay.multipleDays', { count: days, defaultValue: `${days} days` });
  }

  /**
   * Get appropriate icon name for streak phase
   */
  static getStreakIcon(streakDays: number): string {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToIconMap: Record<StreakPhase, string> = {
      START: 'play-circle-outline',
      FIRST: 'star-outline',
      EARLY: 'trending-up',
      WEEK: 'calendar-week',
      TWO_WEEKS: 'trophy-outline',
      MONTH: 'crown-outline',
      TWO_MONTHS: 'diamond-outline',
      HUNDRED: 'medal',
      LEGENDARY: 'fire',
    };

    return phaseToIconMap[phase];
  }

  /**
   * Get appropriate color theme for streak phase
   */
  static getStreakColorTheme(streakDays: number): {
    primary: string;
    secondary: string;
    intensity: 'low' | 'medium' | 'high' | 'legendary';
  } {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToColorMap: Record<StreakPhase, ReturnType<typeof StreakDisplayService.getStreakColorTheme>> = {
      START: { primary: '#6B7280', secondary: '#9CA3AF', intensity: 'low' },
      FIRST: { primary: '#10B981', secondary: '#34D399', intensity: 'low' },
      EARLY: { primary: '#3B82F6', secondary: '#60A5FA', intensity: 'medium' },
      WEEK: { primary: '#8B5CF6', secondary: '#A78BFA', intensity: 'medium' },
      TWO_WEEKS: { primary: '#F59E0B', secondary: '#FBBF24', intensity: 'high' },
      MONTH: { primary: '#EF4444', secondary: '#F87171', intensity: 'high' },
      TWO_MONTHS: { primary: '#EC4899', secondary: '#F472B6', intensity: 'high' },
      HUNDRED: { primary: '#8B5CF6', secondary: '#A78BFA', intensity: 'legendary' },
      LEGENDARY: { primary: '#F59E0B', secondary: '#FBBF24', intensity: 'legendary' },
    };

    return phaseToColorMap[phase];
  }

  /**
   * Check if streak deserves celebration (milestone reached)
   */
  static shouldCelebrate(previousStreak: number, currentStreak: number): boolean {
    const prevPhase = this.getStreakPhase(previousStreak);
    const currentPhase = this.getStreakPhase(currentStreak);
    
    // Celebrate when moving to a new phase
    return prevPhase !== currentPhase && currentStreak > previousStreak;
  }

  /**
   * Get celebration message for reaching a new milestone
   */
  static getCelebrationMessage(
    streakDays: number, 
    t: (key: string, options?: any) => string
  ): string {
    const phase = this.getStreakPhase(streakDays);
    
    const phaseToCelebrationMap: Record<StreakPhase, string> = {
      START: 'streakOverlay.celebrationStart',
      FIRST: 'streakOverlay.celebrationFirst',
      EARLY: 'streakOverlay.celebrationEarly',
      WEEK: 'streakOverlay.celebrationWeek',
      TWO_WEEKS: 'streakOverlay.celebrationTwoWeeks',
      MONTH: 'streakOverlay.celebrationMonth',
      TWO_MONTHS: 'streakOverlay.celebrationTwoMonths',
      HUNDRED: 'streakOverlay.celebrationHundred',
      LEGENDARY: 'streakOverlay.celebrationLegendary',
    };

    const defaultMessages: Record<StreakPhase, string> = {
      START: 'Welcome to your streak journey! 🌟',
      FIRST: 'Amazing first step! Keep it up! 🎉',
      EARLY: 'You\'re building great momentum! 💪',
      WEEK: 'One full week completed! Incredible! 🏆',
      TWO_WEEKS: 'Two weeks of dedication! You\'re a champion! 👑',
      MONTH: 'A full month! You\'re officially a habit master! 🎯',
      TWO_MONTHS: 'Two months strong! You\'re a true hero! 🦸',
      HUNDRED: '100 days! You\'ve achieved something legendary! 💎',
      LEGENDARY: 'You\'re in legendary territory now! Unstoppable! 🔥',
    };

    return t(phaseToCelebrationMap[phase], { 
      defaultValue: defaultMessages[phase],
      count: streakDays 
    });
  }
} 