export type MascotVariant = 
  | 'waving' 
  | 'glasses' 
  | 'brushing' 
  | 'welcoming' 
  | 'glasses-1-pp'
  | 'another-pp-variant' // Example: Add more PP variants as needed
  | 'another-expanded-variant'; // Example: Add more expanded variants as needed 

export interface MascotPositioning {
  translateX: number;
  translateY: number;
  scale: number;
} 