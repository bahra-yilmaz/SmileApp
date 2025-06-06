import type { DynamicMascotTheme, MascotPositioning, PpMascotVariant, NonPpMascotVariant } from '../types/mascot';
import { coolGreetingKeys, wiseGreetingKeys, playfulGreetingKeys } from './mascotGreetingKeys';
// Potentially import getMascotPositioning if needed for more dynamic positioning within a theme, though not used in this example.
// import { getMascotPositioning } from '../utils/mascotUtils';

export const dynamicMascotThemes: DynamicMascotTheme[] = [
  {
    themeId: 'cool',
    profilePictureVariants: [
      'nubo-cool-1-pp',
      'nubo-cool-2-pp',
      'nubo-cool-3-pp',
    ],
    poseVariants: [
      'nubo-cool-1',
      'nubo-cool-2',
      'nubo-cool-3',
      'nubo-cool-4',
    ],
    greetingTextKeys: coolGreetingKeys, // Using the imported array of 20 keys
    selectionWeight: 0.7, // Example weight: this theme is fairly likely to be picked if dynamic themes are chosen
  },
  {
    themeId: 'wise',
    profilePictureVariants: [
      'nubo-wise-1-pp',
      'nubo-wise-2-pp',
      'nubo-wise-3-pp',
    ],
    poseVariants: [
      'nubo-wise-1',
      'nubo-wise-2',
      'nubo-wise-3',
      'nubo-wise-4',
    ],
    greetingTextKeys: wiseGreetingKeys,
    selectionWeight: 0.3,
  },
  {
    themeId: 'playful',
    profilePictureVariants: [
      'nubo-playful-1-pp',
      'nubo-playful-2-pp',
      'nubo-playful-3-pp',
      'nubo-playful-4-pp',
    ],
    poseVariants: [
      'nubo-playful-1',
      'nubo-playful-2',
      'nubo-playful-3',
      'nubo-playful-4',
      'nubo-playful-5',
    ],
    greetingTextKeys: playfulGreetingKeys,
    selectionWeight: 0.5,
  },
  // Example of another theme (you can add more later)
  // {
  //   themeId: 'wise',
  //   profilePictureVariants: ['nubo-wise-1-pp'],
  //   poseVariants: ['nubo-wise-1'],
  //   greetingTextKeys: [/* import wiseGreetingKeys */],
  //   defaultMascotPosition: { translateX: -3, translateY: 1, scale: 0.9 },
  //   selectionWeight: 0.3,
  // },
]; 