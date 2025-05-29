// constants/mascotConfig.ts
import type { MascotVariant, MascotPositioning } from '../types/mascot';

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
  collapsedVariant: MascotVariant;
  expandedVariant: MascotVariant;
  greetingTextKey: string;
  probability: number; // Higher number means higher chance, doesn't have to sum to 1 or 100
  mascotPosition: MascotPositioning; // Add mascotPosition
}

export const mascotConfigurations: MascotConfig[] = [
  {
    id: 'config1',
    collapsedVariant: 'glasses-1-pp', // Example PP variant
    expandedVariant: 'waving',        // Example expanded variant
    greetingTextKey: 'mascotGreetings.smileJourney',
    probability: 0.4, // 40% chance
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 }, // Default position
  },
  {
    id: 'config2',
    collapsedVariant: 'another-pp-variant', // Another PP variant
    expandedVariant: 'welcoming',         // Another expanded variant
    greetingTextKey: 'mascotGreetings.welcomeBack',
    probability: 0.3, // 30% chance
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 }, // Default position
  },
  {
    id: 'config3',
    collapsedVariant: 'glasses-1-pp',
    expandedVariant: 'brushing',
    greetingTextKey: 'mascotGreetings.pearlyWhites',
    probability: 0.2, // 20% chance
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 }, // Default position
  },
  {
    id: 'config4',
    collapsedVariant: 'another-pp-variant',
    expandedVariant: 'another-expanded-variant',
    greetingTextKey: 'mascotGreetings.nuboHelp',
    probability: 0.1, // 10% chance
    mascotPosition: { translateX: 0, translateY: 0, scale: 1 }, // Default position
  },
  // Add more configurations as needed, using appropriate greetingTextKey values
];

// Default configuration to prevent errors if mascotConfigurations is empty or selection fails
const defaultMascotConfig: MascotConfig = {
  id: 'default',
  collapsedVariant: 'glasses-1-pp', // Or your most basic/default PP variant
  expandedVariant: 'waving',       // Or your most basic/default expanded variant
  greetingTextKey: 'mascotGreetings.defaultHello', // A default greeting key
  probability: 1,
  mascotPosition: { translateX: 0, translateY: 0, scale: 1 },
};

// Helper function to select a mascot configuration based on probability
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