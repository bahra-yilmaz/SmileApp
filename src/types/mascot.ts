// src/types/mascot.ts

// Placeholder MascotVariant type. Replace with your actual variants.
export type MascotVariant = 
  | 'waving' 
  | 'glasses' 
  | 'brushing' 
  | 'welcoming' 
  | 'glasses-1-pp' // Example existing
  | 'default-pp'
  | 'default-pose'
  | 'wise-pp'
  | 'wise-pose'
  | 'cool-pp'
  | 'cool-pose'
  | 'friendly-pp'
  | 'friendly-pose';
  // Add all your actual mascot animation/image key names here

export interface MascotProfile {
  id: string; // e.g., 'wise', 'cool', 'friendly'
  profilePictureVariant: MascotVariant; // Variant for the collapsed state
  poseVariant: MascotVariant;           // Variant for the expanded state
  greetings: string[];                  // Array of possible texts for this profile
} 