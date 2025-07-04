import { ImageSourcePropType } from 'react-native';
import { PersonalityType } from '../types/mascot';

type MascotImageMap = {
  [key in PersonalityType]: ImageSourcePropType[];
};

const mascotImages: MascotImageMap = {
  cool: [
    require('../assets/mascot/nubo-cool-1.png'),
    require('../assets/mascot/nubo-cool-2.png'),
    require('../assets/mascot/nubo-cool-3.png'),
    require('../assets/mascot/nubo-cool-4.png'),
  ],
  playful: [
    require('../assets/mascot/nubo-playful-1.png'),
    require('../assets/mascot/nubo-playful-2.png'),
    require('../assets/mascot/nubo-playful-3.png'),
    require('../assets/mascot/nubo-playful-4.png'),
    require('../assets/mascot/nubo-playful-5.png'),
  ],
  supportive: [
    require('../assets/mascot/nubo-supportive-1.png'),
    require('../assets/mascot/nubo-supportive-2.png'),
    require('../assets/mascot/nubo-supportive-3.png'),
    require('../assets/mascot/nubo-supportive-4.png'),
    require('../assets/mascot/nubo-supportive-5.png'),
    require('../assets/mascot/nubo-supportive-6.png'),
    require('../assets/mascot/nubo-welcoming-1.png'),
    require('../assets/mascot/nubo-welcoming-2.png'),
    require('../assets/mascot/nubo-welcoming-3.png'),
  ],
  wise: [
    require('../assets/mascot/nubo-wise-1.png'),
    require('../assets/mascot/nubo-wise-2.png'),
    require('../assets/mascot/nubo-wise-3.png'),
    require('../assets/mascot/nubo-wise-4.png'),
    require('../assets/mascot/nubo-wise-5.png'),
  ],
};

const defaultImage = require('../assets/mascot/nubo-welcoming-1.png');

export class MascotImageService {
  /**
   * Get a random mascot image for a given personality.
   * @param personality The personality type ('cool', 'playful', 'supportive', 'wise').
   * @returns An ImageSourcePropType for the randomly selected image.
   */
  static getRandomImageForPersonality(personality?: PersonalityType): ImageSourcePropType {
    const images = personality ? mascotImages[personality] : null;
    if (!images || images.length === 0) {
      return defaultImage;
    }
    const randomIndex = Math.floor(Math.random() * images.length);
    return images[randomIndex];
  }
} 