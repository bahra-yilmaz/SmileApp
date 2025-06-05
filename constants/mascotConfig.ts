// constants/mascotConfig.ts
import type { MascotPositioning, PpMascotVariant, NonPpMascotVariant, MascotConfig } from '../types/mascot';
import { dynamicMascotThemes } from './mascotThemes';
import { generateMascotConfigFromTheme } from '../utils/mascotUtils';

// It would be best to move this MascotVariant type to a central types file (e.g., src/types/mascot.ts)
// and import it here and in ExpandableMascotCard.tsx
// export type MascotVariant = 
//   | 'waving' 
//   | 'glasses' 
//   | 'brushing' 
//   | 'welcoming' 
//   | 'glasses-1-pp'
//   | 'another-pp-variant' // Example: Add more PP variants as needed
//   | 'another-expanded-variant'; // Example: Add more expanded variants as needed

export const mascotConfigurations: MascotConfig[] = [
  // --- Configurations for 'waving' (expanded) with 'glasses-1-pp' (collapsed) ---
  {
    id: 'waving_glassesPP_text1',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-wave',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.greeting1',
    probability: 0.001,
  },
  {
    id: 'waving_glassesPP_text2',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-wave',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.greeting2',
    probability: 0.001,
  },
  {
    id: 'waving_glassesPP_text3',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-wave',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.tip1',
    probability: 0.001,
  },

  // --- Configurations for 'brushing' (expanded) with 'another-pp-variant' (collapsed) ---
  {
    id: 'brushing_anotherPP_text1',
    collapsedVariant: 'nubo-brushing-1-pp',
    expandedVariant: 'nubo-daily-brush',
    greetingTextKey: 'mascotGreetings.brushingTime.reminder1',
    probability: 0.001,
  },
  {
    id: 'brushing_anotherPP_text2',
    collapsedVariant: 'nubo-brushing-1-pp',
    expandedVariant: 'nubo-daily-brush',
    greetingTextKey: 'mascotGreetings.brushingTime.fact1',
    probability: 0.001,
  },

  // --- Example Configurations for Playful Reminders with 'welcoming' mascot ---
  {
    id: 'playful_hollywood',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-1',
    greetingTextKey: 'mascotGreetings.playfulReminders.hollywoodSmile',
    probability: 0.001,
  },
  {
    id: 'playful_toothFairy',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-welcoming-1',
    greetingTextKey: 'mascotGreetings.playfulReminders.toothFairyResigning',
    probability: 0.001,
  },
  // ... Add entries for the other 8 playful texts here, e.g.:
  // {
  //   id: 'playful_breakAlgorithm',
  //   collapsedVariant: 'nubo-cool-3-pp',
  //   expandedVariant: 'nubo-welcoming-1',
  //   greetingTextKey: 'mascotGreetings.playfulReminders.breakAlgorithm',
  //   probability: 0.02,
  //   mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  // },
  
  // --- NEW Cool Category Configurations ---
  {
    id: 'cool_pp1_pose1_riskyMove',
    collapsedVariant: 'nubo-cool-1-pp',
    expandedVariant: 'nubo-cool-1',
    greetingTextKey: 'mascotGreetings.cool.riskyMove',
    probability: 0.01, // Assign probabilities as you see fit
  },
  {
    id: 'cool_pp2_pose2_shinyTeeth',
    collapsedVariant: 'nubo-cool-2-pp',
    expandedVariant: 'nubo-cool-2',
    greetingTextKey: 'mascotGreetings.cool.shinyTeeth',
    probability: 0.01,
  },
  {
    id: 'cool_pp3_pose3_brushNow',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-cool-3',
    greetingTextKey: 'mascotGreetings.cool.brushNow',
    probability: 0.01,
  },
  {
    id: 'cool_pp1_pose4_lessTalk',
    collapsedVariant: 'nubo-cool-1-pp',
    expandedVariant: 'nubo-cool-4',
    greetingTextKey: 'mascotGreetings.cool.lessTalk',
    probability: 0.01,
  },
  {
    id: 'cool_pp2_pose5_skippingToday',
    collapsedVariant: 'nubo-cool-2-pp',
    expandedVariant: 'nubo-cool-5',
    greetingTextKey: 'mascotGreetings.cool.skippingToday',
    probability: 0.01,
  },
  // Add more combinations for the other 15 cool texts...
  // Example for "I wear shades for your shine."
  {
    id: 'cool_pp3_pose1_shadesForShine',
    collapsedVariant: 'nubo-cool-3-pp',
    expandedVariant: 'nubo-cool-1',
    greetingTextKey: 'mascotGreetings.cool.shadesForShine',
    probability: 0.01,
  },

  // Add more configurations for other mascot pairs and texts as needed
];

const defaultStaticMascotConfig: MascotConfig = {
  id: 'default-static',
  collapsedVariant: 'nubo-welcoming-1-pp',
  expandedVariant: 'nubo-welcoming-1',
  greetingTextKey: 'mascotGreetings.defaultHello',
  probability: 1,
};

// MODIFIED getRandomMascotConfig to handle both static and dynamic theme-based configurations
export const getRandomMascotConfig = (): MascotConfig => {
  const totalStaticProbability = mascotConfigurations.reduce((sum, config) => sum + config.probability, 0);
  const totalDynamicThemeWeight = dynamicMascotThemes.reduce((sum, theme) => sum + theme.selectionWeight, 0);
  const totalOverallChance = totalStaticProbability + totalDynamicThemeWeight;

  if (totalOverallChance === 0) {
    console.warn('No mascot configurations or themes available with positive probability/weight. Returning default static config.');
    return defaultStaticMascotConfig; 
  }

  let randomPoint = Math.random() * totalOverallChance;

  // Check if we should pick a static configuration
  if (randomPoint < totalStaticProbability) {
    // Pick from static configurations (original logic)
    let cumulativeProbability = 0;
    for (const config of mascotConfigurations) {
      cumulativeProbability += config.probability;
      if (randomPoint < cumulativeProbability) {
        return config;
      }
    }
    // Fallback for static if somehow not picked (should not happen if probabilities sum correctly)
    return mascotConfigurations[0] || defaultStaticMascotConfig;
  } else {
    // Adjust randomPoint for dynamic theme selection
    randomPoint -= totalStaticProbability;

    // Pick from dynamic themes
    let cumulativeWeight = 0;
    for (const theme of dynamicMascotThemes) {
      cumulativeWeight += theme.selectionWeight;
      if (randomPoint < cumulativeWeight) {
        return generateMascotConfigFromTheme(theme);
      }
    }
    // Fallback for dynamic themes if somehow not picked (should not happen if weights sum correctly)
    // This could happen if dynamicMascotThemes is empty or all weights are 0.
    if (dynamicMascotThemes.length > 0) {
      return generateMascotConfigFromTheme(dynamicMascotThemes[0]);
    } 
    // If no dynamic themes, fall back to default static (though this case is covered by totalOverallChance === 0)
    return defaultStaticMascotConfig;
  }
}; 