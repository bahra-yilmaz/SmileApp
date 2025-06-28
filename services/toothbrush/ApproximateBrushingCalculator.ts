import { BrushingGoalsService } from '../BrushingGoalsService';

/**
 * Service for calculating approximate brushing counts for existing toothbrushes
 * Uses intelligent estimation based on user habits and realistic usage patterns
 */
export class ApproximateBrushingCalculator {
  
  /**
   * Calculate approximate brushing count based on toothbrush age and user patterns
   */
  static async calculateApproximateBrushings(params: {
    ageDays: number;
    userId: string;
    toothbrushPurpose?: 'regular' | 'travel' | 'backup' | 'braces' | 'sensitive' | 'whitening';
    toothbrushType?: 'manual' | 'electric';
  }): Promise<{
    estimatedBrushings: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    calculationMethod: string;
    factors: string[];
  }> {
    const { ageDays, userId, toothbrushPurpose = 'regular', toothbrushType = 'manual' } = params;
    
    console.log('🧮 Calculating approximate brushings for:', { ageDays, userId, toothbrushPurpose, toothbrushType });

    // Get user's current brushing goals for personalized estimation
    const userGoals = await this.getUserBrushingGoals(userId);
    
    // Base calculation factors
    const factors: string[] = [];
    let dailyBrushingFrequency = userGoals.dailyFrequency || 2; // Default to 2x daily
    
    // Adjust frequency based on toothbrush purpose
    const purposeMultiplier = this.getPurposeMultiplier(toothbrushPurpose);
    dailyBrushingFrequency *= purposeMultiplier;
    
    if (purposeMultiplier !== 1) {
      factors.push(`${toothbrushPurpose} brush usage pattern`);
    }
    
    // Apply realistic usage coefficient (people don't brush 100% consistently)
    const realisticUsageRate = this.getRealisticUsageRate(ageDays);
    factors.push(`${Math.round(realisticUsageRate * 100)}% realistic usage consistency`);
    
    // Calculate base estimate
    const theoreticalBrushings = ageDays * dailyBrushingFrequency;
    const estimatedBrushings = Math.round(theoreticalBrushings * realisticUsageRate);
    
    // Determine confidence level
    const confidenceLevel = this.getConfidenceLevel(ageDays, userGoals.hasHistoricalData);
    
    // Build calculation method description
    const calculationMethod = `${ageDays} days × ${dailyBrushingFrequency} daily frequency × ${Math.round(realisticUsageRate * 100)}% consistency`;
    
    factors.push(`User's ${userGoals.dailyFrequency}x daily brushing goal`);
    
    const result = {
      estimatedBrushings,
      confidenceLevel,
      calculationMethod,
      factors
    };
    
    console.log('✅ Calculated approximate brushings:', result);
    return result;
  }

  /**
   * Get user's current brushing goals for personalized estimation
   */
  private static async getUserBrushingGoals(userId: string): Promise<{
    dailyFrequency: number;
    hasHistoricalData: boolean;
  }> {
    try {
      // Guest users get default values
      if (userId === 'guest') {
        return { dailyFrequency: 2, hasHistoricalData: false };
      }

      const goals = await BrushingGoalsService.getCurrentGoals();
      
      return {
        dailyFrequency: goals.dailyFrequency || 2,
        hasHistoricalData: !!goals.lastSyncTimestamp // If synced with DB, user has historical data
      };
    } catch (error) {
      console.warn('⚠️ Could not fetch user goals, using defaults:', error);
      return { dailyFrequency: 2, hasHistoricalData: false };
    }
  }

  /**
   * Get multiplier based on toothbrush purpose
   * Different types of brushes are used with different frequencies
   */
  private static getPurposeMultiplier(purpose: string): number {
    switch (purpose) {
      case 'regular':
        return 1.0; // Normal daily use
      case 'travel':
        return 0.3; // Used only when traveling (~30% of time)
      case 'backup':
        return 0.1; // Rarely used backup (~10% of time)
      case 'braces':
        return 1.2; // People with braces often brush more frequently
      case 'sensitive':
        return 0.9; // Might brush slightly less due to sensitivity
      case 'whitening':
        return 1.1; // Often used more frequently for whitening routine
      default:
        return 1.0;
    }
  }

  /**
   * Get realistic usage rate based on brush age
   * Accounts for the fact that people don't maintain perfect brushing consistency
   */
  private static getRealisticUsageRate(ageDays: number): number {
    if (ageDays <= 7) {
      return 0.95; // Very new brush, high consistency
    } else if (ageDays <= 30) {
      return 0.85; // First month, good consistency
    } else if (ageDays <= 60) {
      return 0.80; // Second month, slight decline
    } else if (ageDays <= 90) {
      return 0.75; // Third month, more decline
    } else {
      return 0.70; // Older brush, lower consistency
    }
  }

  /**
   * Determine confidence level for the estimation
   */
  private static getConfidenceLevel(ageDays: number, hasHistoricalData: boolean): 'high' | 'medium' | 'low' {
    if (hasHistoricalData && ageDays <= 30) {
      return 'high'; // Recent brush with user history
    } else if (ageDays <= 60) {
      return 'medium'; // Reasonable timeframe
    } else {
      return 'low'; // Older brush, harder to estimate
    }
  }

  /**
   * Generate a user-friendly explanation of the estimation
   */
  static generateEstimationExplanation(calculation: {
    estimatedBrushings: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    calculationMethod: string;
    factors: string[];
  }, ageDays: number): string {
    const { estimatedBrushings, confidenceLevel, factors } = calculation;
    
    const ageText = ageDays === 1 ? '1 day' : 
                   ageDays < 7 ? `${ageDays} days` :
                   ageDays < 30 ? `${Math.round(ageDays / 7)} weeks` :
                   `${Math.round(ageDays / 30)} months`;
    
    const confidenceText = {
      high: 'high confidence',
      medium: 'moderate confidence', 
      low: 'rough estimate'
    }[confidenceLevel];
    
    return `Estimated ~${estimatedBrushings} brushings over ${ageText} (${confidenceText})`;
  }

  /**
   * Validate if the estimation seems reasonable
   * Provides bounds checking to catch unrealistic estimates
   */
  static validateEstimation(estimatedBrushings: number, ageDays: number): {
    isReasonable: boolean;
    warning?: string;
  } {
    const maxReasonableBrushings = ageDays * 4; // Max 4 times per day seems reasonable
    const minReasonableBrushings = Math.max(0, ageDays * 0.2); // At least 20% of days
    
    if (estimatedBrushings > maxReasonableBrushings) {
      return {
        isReasonable: false,
        warning: `Estimation (${estimatedBrushings}) seems too high for ${ageDays} days`
      };
    }
    
    if (estimatedBrushings < minReasonableBrushings && ageDays > 7) {
      return {
        isReasonable: false,
        warning: `Estimation (${estimatedBrushings}) seems too low for ${ageDays} days`
      };
    }
    
    return { isReasonable: true };
  }
} 