// ⚠️ DEPRECATED - COMPLEX COMBINATIONS LOGIC CLEARED
// This file contains the old mascot utility functions that have been 
// temporarily disabled while preparing for a new, more robust system.
// 
// DO NOT USE EXPORTS FROM THIS FILE IN ACTIVE CODE

// import { useMemo } from 'react'; // useMemo is not used in this file anymore
import type { NonPpMascotVariant, MascotPositioning, MascotConfig, DynamicMascotTheme } from '../types/mascot';

// Mascot variant types that don't end with 'pp'
// export type NonPpMascotVariant = 'waving' | 'glasses' | 'brushing' | 'welcoming';

// Type for mascot positioning data
// export interface MascotPositioning {
//   translateX: number;
//   translateY: number;
//   scale: number;
// }

// Available mascot variants without "pp" ending
// export const NON_PP_MASCOT_VARIANTS: readonly NonPpMascotVariant[] = [
//   'waving',
//   'glasses',
//   'brushing',
//   'welcoming'
// ];

/**
 * @deprecated This function is no longer used by the core mascot configuration system 
 *             as specific mascot positioning has been removed from MascotConfig.
 *             It could be repurposed if fine-grained positioning is needed elsewhere.
 * Gets positioning adjustments for a specific mascot variant (NonPpMascotVariant, e.g., 'nubo-welcoming-1').
 * This function can be useful for populating MascotConfig.mascotPosition consistently.
 */
// export function getMascotPositioning(variant: NonPpMascotVariant): MascotPositioning {
//   switch (variant) {
//     case 'nubo-cool-2': 
//       return {
//         translateX: -4,
//         translateY: 1,
//         scale: 1,
//       };
//     case 'nubo-welcoming-wave': 
//       return {
//         translateX: -2,
//         translateY: 3,
//         scale: 0.95,
//       };
//     case 'nubo-daily-brush': 
//     case 'nubo-daily-brush-2': 
//       return {
//         translateX: -6,
//         translateY: 2,
//         scale: 0.95,
//       };
//     case 'nubo-welcoming-1': 
//     case 'nubo-welcoming-2': 
//       return {
//         translateX: -3,
//         translateY: 0,
//         scale: 0.9,
//       };
//     default:
//       if (variant.includes('wise')) return { translateX: -3, translateY: 1, scale: 0.9 }; 
//       if (variant.includes('cool') || variant.includes('glasses')) return getMascotPositioning('nubo-cool-2');
//       if (variant.includes('wave')) return getMascotPositioning('nubo-welcoming-wave');
//       if (variant.includes('brush')) return getMascotPositioning('nubo-daily-brush');
//       if (variant.includes('welcom')) return getMascotPositioning('nubo-welcoming-1');
      
//       console.warn(`No specific positioning for mascot variant "${variant}", using generic default.`);
//       return { 
//         translateX: -4,
//         translateY: 1,
//         scale: 1,
//       };
//   }
// }

// NEW function to generate a MascotConfig from a DynamicMascotTheme
export function generateMascotConfigFromTheme(theme: DynamicMascotTheme): MascotConfig {
  const selectedProfilePictureVariant = 
    theme.profilePictureVariants[Math.floor(Math.random() * theme.profilePictureVariants.length)];
  
  const selectedPoseVariant = 
    theme.poseVariants[Math.floor(Math.random() * theme.poseVariants.length)];
  
  const selectedGreetingTextKey = 
    theme.greetingTextKeys[Math.floor(Math.random() * theme.greetingTextKeys.length)];

  // const mascotPosition = theme.defaultMascotPosition; // REMOVED as positioning is removed

  return {
    id: `dynamic-${theme.themeId}-${selectedProfilePictureVariant}-${selectedPoseVariant}-${Date.now()}`,
    collapsedVariant: selectedProfilePictureVariant,
    expandedVariant: selectedPoseVariant,
    greetingTextKey: selectedGreetingTextKey,
    // mascotPosition: mascotPosition, // REMOVED
    probability: 1, 
  };
}

// useRandomMascot hook is removed as getRandomMascotConfig is used instead. 