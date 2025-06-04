// Define your PP (Profile Picture) Mascot Variants here
// Variants ending with '-pp' are considered PP versions.
export type PpMascotVariant = 
  | 'nubo-wise-1-pp'
  | 'nubo-welcoming-1-pp';

// Define your Non-PP (Expanded/Other) Mascot Variants here
export type NonPpMascotVariant = 
  | 'nubo-wise-1'
  | 'nubo-welcoming-1'
  | 'nubo-welcoming-2'
  | 'nubo-welcoming-wave'
  | 'nubo-daily-brush';

// Combined type for general use, e.g., in the Mascot component itself
export type MascotVariant = PpMascotVariant | NonPpMascotVariant;

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 