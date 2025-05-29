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
  {
    id: 'config1',
    collapsedVariant: 'glasses-1-pp',         // Must be a PpMascotVariant
    expandedVariant: 'waving',               // Must be a NonPpMascotVariant
    greetingTextKey: 'mascotGreetings.smileJourney',
    probability: 0.4,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'config2',
    collapsedVariant: 'another-pp-variant',   // Must be a PpMascotVariant
    expandedVariant: 'welcoming',            // Must be a NonPpMascotVariant
    greetingTextKey: 'mascotGreetings.welcomeBack',
    probability: 0.3,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'config3',
    collapsedVariant: 'glasses-1-pp',        // Must be a PpMascotVariant
    expandedVariant: 'brushing',             // Must be a NonPpMascotVariant
    greetingTextKey: 'mascotGreetings.pearlyWhites',
    probability: 0.2,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  {
    id: 'config4',
    collapsedVariant: 'another-pp-variant',  // Must be a PpMascotVariant
    expandedVariant: 'another-expanded-variant', // Must be a NonPpMascotVariant
    greetingTextKey: 'mascotGreetings.nuboHelp',
    probability: 0.1,
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
  },
  // Add more configurations as needed, ensuring types are correct
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