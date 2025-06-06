// src/types/mascot.ts

// The comprehensive list of all available mascot image keys.
export type MascotVariant =
  // Welcoming & Waving
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-welcoming-1-pp'
  // Brushing
  | 'nubo-daily-brush'
  | 'nubo-daily-brush-2'
  | 'nubo-brushing-1-pp'
  // Cool
  | 'nubo-cool-1'
  | 'nubo-cool-2'
  | 'nubo-cool-3'
  | 'nubo-cool-4'
  | 'nubo-cool-5'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp'
  | 'nubo-cool-3-pp'
  // Wise
  | 'nubo-wise-1'
  | 'nubo-wise-2'
  | 'nubo-wise-3'
  | 'nubo-wise-4'
  | 'nubo-wise-1-pp'
  | 'nubo-wise-2-pp'
  | 'nubo-wise-3-pp'
  // Playful
  | 'nubo-playful-1'
  | 'nubo-playful-2'
  | 'nubo-playful-3'
  | 'nubo-playful-4'
  | 'nubo-playful-5'
  | 'nubo-playful-1-pp'
  | 'nubo-playful-2-pp'
  | 'nubo-playful-3-pp'
  | 'nubo-playful-4-pp'
  // Supportive
  | 'nubo-supportive-1'
  | 'nubo-supportive-2'
  | 'nubo-supportive-3'
  | 'nubo-supportive-4'
  | 'nubo-supportive-5'
  | 'nubo-supportive-6'
  | 'nubo-supportive-1-pp'
  | 'nubo-supportive-2-pp'
  | 'nubo-supportive-3-pp'
  // Legacy/Unused (examples)
  | 'waving'
  | 'glasses'
  | 'brushing'
  | 'welcoming'
  | 'glasses-1-pp'
  | 'default-pp'
  | 'default-pose'
  | 'wise-pp'
  | 'wise-pose'
  | 'cool-pp'
  | 'cool-pose'
  | 'friendly-pp'
  | 'friendly-pose';

export interface MascotProfile {
  id: string; // e.g., 'wise', 'cool', 'friendly'
  profilePictureVariant: MascotVariant; // Variant for the collapsed state
  poseVariant: MascotVariant;           // Variant for the expanded state
  greetings: string[];                  // Array of possible texts for this profile
}

// All variants ending with '-pp', used for collapsed states and dynamic themes.
export type PpMascotVariant =
  | 'nubo-welcoming-1-pp'
  | 'nubo-brushing-1-pp'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp'
  | 'nubo-cool-3-pp'
  | 'nubo-wise-1-pp'
  | 'nubo-wise-2-pp'
  | 'nubo-wise-3-pp'
  | 'nubo-playful-1-pp'
  | 'nubo-playful-2-pp'
  | 'nubo-playful-3-pp'
  | 'nubo-playful-4-pp'
  | 'nubo-supportive-1-pp'
  | 'nubo-supportive-2-pp'
  | 'nubo-supportive-3-pp';

// All variants NOT ending with '-pp', used for expanded states and dynamic themes.
export type NonPpMascotVariant =
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-daily-brush'
  | 'nubo-daily-brush-2'
  | 'nubo-cool-1'
  | 'nubo-cool-2'
  | 'nubo-cool-3'
  | 'nubo-cool-4'
  | 'nubo-cool-5'
  | 'nubo-wise-1'
  | 'nubo-wise-2'
  | 'nubo-wise-3'
  | 'nubo-wise-4'
  | 'nubo-playful-1'
  | 'nubo-playful-2'
  | 'nubo-playful-3'
  | 'nubo-playful-4'
  | 'nubo-playful-5'
  | 'nubo-supportive-1'
  | 'nubo-supportive-2'
  | 'nubo-supportive-3'
  | 'nubo-supportive-4'
  | 'nubo-supportive-5'
  | 'nubo-supportive-6';

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
}

// Configuration for a specific mascot appearance, combining a PP and a Pose.
export interface MascotConfig {
  id: string;
  collapsedVariant: PpMascotVariant;
  expandedVariant: NonPpMascotVariant;
  greetingTextKey: string;
  probability: number;
}

// Defines a theme for generating dynamic mascot configurations.
export interface DynamicMascotTheme {
  themeId: string;
  profilePictureVariants: PpMascotVariant[];
  poseVariants: NonPpMascotVariant[];
  greetingTextKeys: string[];
  selectionWeight: number;
} 