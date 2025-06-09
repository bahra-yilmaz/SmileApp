// Define your PP (Profile Picture) Mascot Variants here
// Variants ending with '-pp' are considered PP versions.
export type PpMascotVariant = 
  | 'nubo-wise-1-pp'
  | 'nubo-welcoming-1-pp'
  | 'nubo-brushing-1-pp'
  | 'nubo-brushing-2-pp'
  | 'nubo-cool-3-pp'
  | 'nubo-cool-1-pp'
  | 'nubo-cool-2-pp';

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'nubo-wise-1'
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-brushing-1'
  | 'nubo-brushing-2'
  | 'nubo-brushing-3'
  | 'nubo-cool-2'
  | 'nubo-cool-1'
  | 'nubo-cool-3'
  | 'nubo-cool-4'
  | 'nubo-cool-5'
  | 'nubo-happy-1'
  | 'nubo-daily-brush-1'
  | 'nubo-success-1'
  | 'nubo-sad-1'
  | 'nubo-bag-1';

// Combined type for general use, e.g., in the Mascot component itself
export type MascotVariant = PpMascotVariant | NonPpMascotVariant;

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 

// Added MascotProfile interface
export interface MascotProfile {
  id: string;
  profilePictureVariant: PpMascotVariant; // Uses existing type for profile pictures
  poseVariant: NonPpMascotVariant;       // Uses existing type for poses/expanded states
  greetings: string[];                  // Array of possible texts for this profile
  // Optional: Consider adding mascotPosition?: MascotPositioning; if it should be tied to the profile
} 

// Added MascotConfig interface (moved from constants/mascotConfig.ts)
export interface MascotConfig {
  id: string;
  collapsedVariant: PpMascotVariant;    // Use specific PP type
  expandedVariant: NonPpMascotVariant;   // Use specific Non-PP type
  greetingTextKey: string; // Key for i18n
  probability: number; // For weighted randomness
} 

// NEW Interface for defining dynamic themes
export interface DynamicMascotTheme {
  themeId: string; // e.g., 'cool', 'wise', 'friendly'
  profilePictureVariants: PpMascotVariant[]; // Pool of PPs for this theme
  poseVariants: NonPpMascotVariant[];       // Pool of poses for this theme
  greetingTextKeys: string[];               // Pool of greeting text keys for this theme
  selectionWeight: number; 
} 