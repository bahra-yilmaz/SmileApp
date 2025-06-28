import { BrushingGoalsService } from '../BrushingGoalsService';

/**
 * Service for calculating approximate brushing counts for existing toothbrushes
 * Uses simple, user-centered estimation: Days × 0.8 × User's Brushing Frequency Target
 */
export class ApproximateBrushingCalculator {
  
  /**
   * Calculate approximate brushing count based on toothbrush age and user's actual brushing target
   * Formula: Days × 0.8 × User's Brushing Frequency Target
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
    const { ageDays, userId } = params;
    
    console.log('🧮 Calculating approximate brushings for:', { ageDays, userId });

    // Get user's actual brushing frequency target
    const userGoals = await this.getUserBrushingGoals(userId);
    const dailyFrequency = userGoals.dailyFrequency || 2; // Default to 2x daily
    
    // Simple, consistent formula: Days × 0.8 × Brushing Frequency Target
    const realisticUsageRate = 0.8; // 80% consistency factor
    const estimatedBrushings = Math.round(ageDays * realisticUsageRate * dailyFrequency);
    
    // Determine confidence level based on data availability
    const confidenceLevel = this.getConfidenceLevel(ageDays, userGoals.hasHistoricalData);
    
    // Build calculation method description
    const calculationMethod = `${ageDays} days × ${realisticUsageRate} consistency × ${dailyFrequency} daily target`;
    
    const factors = [
      `User's ${dailyFrequency}x daily brushing target`,
      `${Math.round(realisticUsageRate * 100)}% realistic usage consistency`
    ];
    
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
    const { estimatedBrushings, confidenceLevel } = calculation;
    
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
   * Simple bounds check: should be between 20% and 120% of theoretical maximum
   */
  static validateEstimation(estimatedBrushings: number, ageDays: number): {
    isReasonable: boolean;
    warning?: string;
  } {
    // Theoretical max: 4 brushings per day (very high but possible)
    const maxReasonableBrushings = ageDays * 4;
    // Theoretical min: at least 20% of 1x daily (very low usage)
    const minReasonableBrushings = Math.max(0, ageDays * 0.2);
    
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