// ===== MASCOT V2 BRIDGE UTILITY =====
// Bridge between the old MascotConfig system and the new V2 robust system
// Allows gradual migration and testing of the new system

import type { 
  MascotConfig, 
  PersonalityType, 
  GreetingContext, 
  MascotGreetingResult 
} from '../types/mascot';
import { mascotGreetingService } from '../services/MascotGreetingService';

/**
 * Configuration for enabling V2 system
 */
interface V2BridgeConfig {
  enabled: boolean;
  personality?: PersonalityType;
  debugMode?: boolean;
}

/**
 * Default bridge configuration (V2 disabled by default for safety)
 */
const DEFAULT_BRIDGE_CONFIG: V2BridgeConfig = {
  enabled: false,
  personality: 'supportive',
  debugMode: false,
};

/**
 * Bridge class that handles the transition between V1 and V2 systems
 */
export class MascotV2Bridge {
  private static instance: MascotV2Bridge;
  private config: V2BridgeConfig;

  private constructor() {
    this.config = { ...DEFAULT_BRIDGE_CONFIG };
  }

  static getInstance(): MascotV2Bridge {
    if (!MascotV2Bridge.instance) {
      MascotV2Bridge.instance = new MascotV2Bridge();
    }
    return MascotV2Bridge.instance;
  }

  /**
   * Configure the V2 bridge
   */
  configure(config: Partial<V2BridgeConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.debugMode) {
      console.log('🤖 MascotV2Bridge configured:', this.config);
    }
  }

  /**
   * Get a mascot configuration - either from V2 system or fallback to V1
   */
  async getMascotConfig(
    context?: GreetingContext,
    fallbackConfig?: MascotConfig
  ): Promise<MascotConfig> {
    
    // If V2 is not enabled, return fallback or generate simple config
    if (!this.config.enabled) {
      if (this.config.debugMode) {
        console.log('🤖 V2 disabled, using fallback config');
      }
      return fallbackConfig || this.generateSimpleFallback();
    }

    try {
      // Use V2 system to get greeting
      const personality = this.config.personality || 'supportive';
      const greetingResult = await mascotGreetingService.getGreeting(personality, context);
      
      // Convert V2 result to V1 MascotConfig format
      const v2Config = this.convertV2ToV1Config(greetingResult);
      
      if (this.config.debugMode) {
        console.log('🤖 V2 system result:', {
          personality,
          category: greetingResult.category,
          subcase: greetingResult.subcase,
          textKey: greetingResult.textKey,
          convertedConfig: v2Config,
        });
      }
      
      return v2Config;
      
    } catch (error) {
      console.warn('🤖 V2 system error, falling back to V1:', error);
      return fallbackConfig || this.generateSimpleFallback();
    }
  }

  /**
   * Check if V2 system is enabled
   */
  isV2Enabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get current personality setting
   */
  getCurrentPersonality(): PersonalityType {
    return this.config.personality || 'supportive';
  }

  /**
   * Convert V2 greeting result to V1 MascotConfig format
   */
  private convertV2ToV1Config(result: MascotGreetingResult): MascotConfig {
    return {
      id: `v2-${result.personality}-${result.category}-${result.subcase}`,
      collapsedVariant: result.visualConfig.collapsedVariant,
      expandedVariant: result.visualConfig.expandedVariant,
      greetingTextKey: result.textKey,
      probability: 1, // V2 system handles probability internally
    };
  }

  /**
   * Generate a simple fallback config when V2 is disabled
   */
  private generateSimpleFallback(): MascotConfig {
    const fallbacks: MascotConfig[] = [
      {
        id: 'fallback-1',
        collapsedVariant: 'nubo-welcoming-1-pp',
        expandedVariant: 'nubo-welcoming-1',
        greetingTextKey: 'mascotGreetings.defaultHello',
        probability: 1,
      },
      {
        id: 'fallback-2',
        collapsedVariant: 'nubo-cool-3-pp',
        expandedVariant: 'nubo-welcoming-wave',
        greetingTextKey: 'mascotGreetings.welcomeBack',
        probability: 1,
      },
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

/**
 * Convenience functions for easy integration
 */

/**
 * Enable V2 system with specified personality
 */
export const enableMascotV2 = (personality: PersonalityType, debugMode = false): void => {
  MascotV2Bridge.getInstance().configure({
    enabled: true,
    personality,
    debugMode,
  });
};

/**
 * Disable V2 system (fallback to V1/temporary configs)
 */
export const disableMascotV2 = (): void => {
  MascotV2Bridge.getInstance().configure({
    enabled: false,
  });
};

/**
 * Get mascot configuration with V2 bridge logic
 * This can be used as a drop-in replacement for getRandomMascotConfig()
 */
export const getBridgedMascotConfig = async (
  context?: GreetingContext,
  fallback?: MascotConfig
): Promise<MascotConfig> => {
  return MascotV2Bridge.getInstance().getMascotConfig(context, fallback);
};

/**
 * Create context from dashboard/user data for V2 system
 */
export const createMascotContext = (dashboardData?: {
  streakDays?: number;
  lastBrushDate?: string;
  totalBrushings?: number;
}, userState?: {
  isFirstBrushEver?: boolean;
}): GreetingContext => {
  return {
    currentTime: new Date(),
    streakDays: dashboardData?.streakDays,
    lastBrushDate: dashboardData?.lastBrushDate ? new Date(dashboardData.lastBrushDate) : undefined,
    totalBrushCount: dashboardData?.totalBrushings,
    isFirstBrushEver: userState?.isFirstBrushEver,
  };
};

// Export singleton instance for direct access
export const mascotV2Bridge = MascotV2Bridge.getInstance(); 