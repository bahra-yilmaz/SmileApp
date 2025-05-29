// constants/mascotConfig.ts
import type { MascotVariant, MascotPositioning, PpMascotVariant, NonPpMascotVariant } from '../types/mascot';

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

interface MascotConfig {
  id: string;
  collapsedVariant: PpMascotVariant;    // Use specific PP type
  expandedVariant: NonPpMascotVariant;   // Use specific Non-PP type
  greetingTextKey: string;
  probability: number; 
  mascotPosition: MascotPositioning;
}

export const mascotConfigurations: MascotConfig[] = [
  // --- Configurations for 'waving' (expanded) with 'glasses-1-pp' (collapsed) ---
  {
    id: 'waving_glassesPP_text1',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'waving',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.greeting1',
    probability: 0.05,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'waving_glassesPP_text2',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'waving',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.greeting2',
    probability: 0.05,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'waving_glassesPP_text3',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'waving',
    greetingTextKey: 'mascotGreetings.wavingWithGlassesPP.tip1',
    probability: 0.04,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },

  // --- Configurations for 'brushing' (expanded) with 'another-pp-variant' (collapsed) ---
  {
    id: 'brushing_anotherPP_text1',
    collapsedVariant: 'another-pp-variant',
    expandedVariant: 'brushing',
    greetingTextKey: 'mascotGreetings.brushingTime.reminder1',
    probability: 0.06,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'brushing_anotherPP_text2',
    collapsedVariant: 'another-pp-variant',
    expandedVariant: 'brushing',
    greetingTextKey: 'mascotGreetings.brushingTime.fact1',
    probability: 0.03,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },

  // --- Example Configurations for Playful Reminders with 'welcoming' mascot ---
  {
    id: 'playful_hollywood',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'welcoming',
    greetingTextKey: 'mascotGreetings.playfulReminders.hollywoodSmile',
    probability: 0.02,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'playful_toothFairy',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'welcoming',
    greetingTextKey: 'mascotGreetings.playfulReminders.toothFairyResigning',
    probability: 0.02,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  // ... Add entries for the other 8 playful texts here, e.g.:
  // {
  //   id: 'playful_breakAlgorithm',
  //   collapsedVariant: 'glasses-1-pp',
  //   expandedVariant: 'welcoming',
  //   greetingTextKey: 'mascotGreetings.playfulReminders.breakAlgorithm',
  //   probability: 0.02,
  //   mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  // },
  
  // Add more configurations for other mascot pairs and texts as needed
];

// Default configuration to prevent errors
const defaultMascotConfig: MascotConfig = {
  id: 'default',
  collapsedVariant: 'glasses-1-pp', // Ensure this is a valid PpMascotVariant from your list
  expandedVariant: 'waving',       // Ensure this is a valid NonPpMascotVariant from your list
  greetingTextKey: 'mascotGreetings.defaultHello',
  probability: 1,
  mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
};

// Helper function to select a mascot configuration (no changes needed here, relies on MascotConfig type)
export const getRandomMascotConfig = (): MascotConfig => {
  if (!mascotConfigurations || mascotConfigurations.length === 0) {
    // console.warn('Mascot configurations are empty. Returning default mascot config.');
    return defaultMascotConfig;
  }

  const totalProbability = mascotConfigurations.reduce((sum, config) => sum + config.probability, 0);
  
  if (totalProbability <= 0) {
    // console.warn('Total probability is zero or negative. Returning first available config or default.');
    return mascotConfigurations[0] || defaultMascotConfig;
  }

  let randomPoint = Math.random() * totalProbability;

  for (const config of mascotConfigurations) {
    if (randomPoint < config.probability) {
      return config;
    }
    randomPoint -= config.probability;
  }

  // Fallback if loop finishes (shouldn't happen if probabilities are positive and sum correctly)
  // console.warn('Mascot selection did not pick one, returning first or default.')
  return mascotConfigurations[0] || defaultMascotConfig; 
}; 