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
  | 'nubo-wise-1'
  | 'nubo-wise-2'
  | 'nubo-wise-3'
  | 'nubo-wise-4'
  | 'nubo-wise-1-pp'
  | 'nubo-wise-2-pp'
  | 'nubo-wise-3-pp'
  | 'nubo-playful-1'
  | 'nubo-playful-2'
  | 'nubo-playful-3'
  | 'nubo-playful-4'
  | 'nubo-playful-5'
  | 'nubo-playful-1-pp'
  | 'nubo-playful-2-pp'
  | 'nubo-playful-3-pp'
  | 'nubo-playful-4-pp'
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

export type PpMascotVariant = 
  | 'nubo-wise-1-pp'
  | 'nubo-wise-2-pp'
  | 'nubo-wise-3-pp'
  | 'nubo-welcoming-1-pp'
  | 'nubo-brushing-1-pp'
  | 'nubo-cool-3-pp'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp'
  | 'nubo-playful-1-pp'
  | 'nubo-playful-2-pp'
  | 'nubo-playful-3-pp'
  | 'nubo-playful-4-pp';

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'nubo-wise-1'
  | 'nubo-wise-2'
  | 'nubo-wise-3'
  | 'nubo-wise-4'
  | 'nubo-playful-1'
  | 'nubo-playful-2'
  | 'nubo-playful-3'
  | 'nubo-playful-4'
  | 'nubo-playful-5'
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-daily-brush' 