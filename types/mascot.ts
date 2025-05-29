// Define your PP (Profile Picture) Mascot Variants here
// Variants ending with '-pp' are considered PP versions.
export type PpMascotVariant = 
  | 'glasses-1-pp'
  | 'another-pp-variant'; // Placeholder, ensure this corresponds to an actual asset if kept

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'waving'
  | 'glasses'
  | 'brushing'
  | 'welcoming'
  | 'another-expanded-variant'; // Placeholder, ensure this corresponds to an actual asset if kept

// Combined type for general use, e.g., in the Mascot component itself
export type MascotVariant = PpMascotVariant | NonPpMascotVariant;

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 