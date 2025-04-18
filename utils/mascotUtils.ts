import { useMemo } from 'react';

// Mascot variant types that don't end with 'pp'
export type NonPpMascotVariant = 'waving' | 'glasses' | 'brushing' | 'welcoming';

// Type for mascot positioning data
export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
}

// Available mascot variants without "pp" ending
export const NON_PP_MASCOT_VARIANTS: readonly NonPpMascotVariant[] = [
  'waving',
  'glasses',
  'brushing',
  'welcoming'
];

/**
 * Gets positioning adjustments for a specific mascot variant
 */
export function getMascotPositioning(variant: NonPpMascotVariant): MascotPositioning {
  switch (variant) {
    case 'glasses':
      return {
        translateX: -4,
        translateY: 1,
        scale: 1,
      };
    case 'waving':
      return {
        translateX: -2,
        translateY: 3,
        scale: 0.95,
      };
    case 'brushing':
      return {
        translateX: -6,
        translateY: 2,
        scale: 0.95,
      };
    case 'welcoming':
      return {
        translateX: -3,
        translateY: 0,
        scale: 0.9,
      };
    default:
      return {
        translateX: -4,
        translateY: 1,
        scale: 1,
      };
  }
}

/**
 * Hook that returns a randomly selected mascot variant and its positioning
 */
export function useRandomMascot() {
  // Randomly select a mascot variant
  const randomMascotVariant = useMemo<NonPpMascotVariant>(() => {
    const randomIndex = Math.floor(Math.random() * NON_PP_MASCOT_VARIANTS.length);
    return NON_PP_MASCOT_VARIANTS[randomIndex];
  }, []);
  
  // Get positioning for the selected variant
  const mascotPosition = useMemo<MascotPositioning>(
    () => getMascotPositioning(randomMascotVariant),
    [randomMascotVariant]
  );
  
  return {
    variant: randomMascotVariant,
    position: mascotPosition
  };
} 