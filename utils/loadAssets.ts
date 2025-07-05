import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';

// Object containing all images for easy access
export const AppImages = {
  // backgrounds
  homescreenBackground: require('../assets/images/homescreen-background.webp'),
  mountain1: require('../assets/images/mountain-1.webp'),
  mountainFaded: require('../assets/images/mountain-faded.png'),
  logo: require('../assets/images/logo.png'),
  meshgradientLightDefault: require('../assets/images/meshgradient-light-default.png'),
  splashScreen: require('../assets/images/splash-screen.png'),
  toothbrush: require('../assets/images/toothbrush.png'),

  // mascot
  'nubo-bag-1': require('../assets/mascot/nubo-bag-1.png'),
  'nubo-brushing-1-pp': require('../assets/mascot/nubo-brushing-1-pp.png'),
  'nubo-brushing-1': require('../assets/mascot/nubo-brushing-1.png'),
  'nubo-brushing-2-pp': require('../assets/mascot/nubo-brushing-2-pp.png'),
  'nubo-brushing-2': require('../assets/mascot/nubo-brushing-2.png'),
  'nubo-brushing-3': require('../assets/mascot/nubo-brushing-3.png'),
  'nubo-coffee-1': require('../assets/mascot/nubo-coffee-1.png'),
  'nubo-coffee-2': require('../assets/mascot/nubo-coffee-2.png'),
  'nubo-cool-1-pp': require('../assets/mascot/nubo-cool-1-pp.png'),
  'nubo-cool-1': require('../assets/mascot/nubo-cool-1.png'),
  'nubo-cool-2-pp': require('../assets/mascot/nubo-cool-2-pp.png'),
  'nubo-cool-2': require('../assets/mascot/nubo-cool-2.png'),
  'nubo-cool-3-pp': require('../assets/mascot/nubo-cool-3-pp.png'),
  'nubo-cool-3': require('../assets/mascot/nubo-cool-3.png'),
  'nubo-cool-4': require('../assets/mascot/nubo-cool-4.png'),
  'nubo-cool-5': require('../assets/mascot/nubo-cool-5.png'),
  'nubo-liked-1-pp': require('../assets/mascot/nubo-liked-1-pp.png'),
  'nubo-liked-1': require('../assets/mascot/nubo-liked-1.png'),
  'nubo-liked-2': require('../assets/mascot/nubo-liked-2.png'),
  'nubo-liked-3': require('../assets/mascot/nubo-liked-3.png'),
  'nubo-neutral-1-pp': require('../assets/mascot/nubo-neutral-1-pp.png'),
  'nubo-neutral-1': require('../assets/mascot/nubo-neutral-1.png'),
  'nubo-neutral-2-pp': require('../assets/mascot/nubo-neutral-2-pp.png'),
  'nubo-neutral-2': require('../assets/mascot/nubo-neutral-2.png'),
  'nubo-neutral-3-pp': require('../assets/mascot/nubo-neutral-3-pp.png'),
  'nubo-neutral-3': require('../assets/mascot/nubo-neutral-3.png'),
  'nubo-neutral-4-pp': require('../assets/mascot/nubo-neutral-4-pp.png'),
  'nubo-neutral-4': require('../assets/mascot/nubo-neutral-4.png'),
  'nubo-neutral-5-pp': require('../assets/mascot/nubo-neutral-5-pp.png'),
  'nubo-neutral-5': require('../assets/mascot/nubo-neutral-5.png'),
  'nubo-neutral-6-pp': require('../assets/mascot/nubo-neutral-6-pp.png'),
  'nubo-neutral-6': require('../assets/mascot/nubo-neutral-6.png'),
  'nubo-neutral-7': require('../assets/mascot/nubo-neutral-7.png'),
  'nubo-playful-1-pp': require('../assets/mascot/nubo-playful-1-pp.png'),
  'nubo-playful-1': require('../assets/mascot/nubo-playful-1.png'),
  'nubo-playful-2-pp': require('../assets/mascot/nubo-playful-2-pp.png'),
  'nubo-playful-2': require('../assets/mascot/nubo-playful-2.png'),
  'nubo-playful-3-pp': require('../assets/mascot/nubo-playful-3-pp.png'),
  'nubo-playful-3': require('../assets/mascot/nubo-playful-3.png'),
  'nubo-playful-4-pp': require('../assets/mascot/nubo-playful-4-pp.png'),
  'nubo-playful-4': require('../assets/mascot/nubo-playful-4.png'),
  'nubo-playful-5': require('../assets/mascot/nubo-playful-5.png'),
  'nubo-supportive-1-pp': require('../assets/mascot/nubo-supportive-1-pp.png'),
  'nubo-supportive-1': require('../assets/mascot/nubo-supportive-1.png'),
  'nubo-supportive-2-pp': require('../assets/mascot/nubo-supportive-2-pp.png'),
  'nubo-supportive-2': require('../assets/mascot/nubo-supportive-2.png'),
  'nubo-supportive-3-pp': require('../assets/mascot/nubo-supportive-3-pp.png'),
  'nubo-supportive-3': require('../assets/mascot/nubo-supportive-3.png'),
  'nubo-supportive-4-pp': require('../assets/mascot/nubo-supportive-4-pp.png'),
  'nubo-supportive-4': require('../assets/mascot/nubo-supportive-4.png'),
  'nubo-supportive-5': require('../assets/mascot/nubo-supportive-5.png'),
  'nubo-supportive-6': require('../assets/mascot/nubo-supportive-6.png'),
  'nubo-timer-1': require('../assets/mascot/nubo-timer-1.png'),
  'nubo-welcoming-wave': require('../assets/mascot/nubo-waving-1.png'),
  'nubo-welcoming-1-pp': require('../assets/mascot/nubo-welcoming-1-pp.png'),
  'nubo-welcoming-1': require('../assets/mascot/nubo-welcoming-1.png'),
  'nubo-welcoming-2': require('../assets/mascot/nubo-welcoming-2.png'),
  'nubo-welcoming-3': require('../assets/mascot/nubo-welcoming-3.png'),
  'nubo-wise-1-pp': require('../assets/mascot/nubo-wise-1-pp.png'),
  'nubo-wise-1': require('../assets/mascot/nubo-wise-1.png'),
  'nubo-wise-2-pp': require('../assets/mascot/nubo-wise-2-pp.png'),
  'nubo-wise-2': require('../assets/mascot/nubo-wise-2.png'),
  'nubo-wise-3-pp': require('../assets/mascot/nubo-wise-3-pp.png'),
  'nubo-wise-3': require('../assets/mascot/nubo-wise-3.png'),
  'nubo-wise-4': require('../assets/mascot/nubo-wise-4.png'),
  'nubo-wise-5': require('../assets/mascot/nubo-wise-5.png'),
  'nubo-wise-6-pp': require('../assets/mascot/nubo-wise-6-pp.png'),
  'nubo-wise-6': require('../assets/mascot/nubo-wise-6.png'),
  'nubo-result-1': require('../assets/mascot/nubo-result-1.png'),
  'nubo-result-2': require('../assets/mascot/nubo-result-2.png'),
  'nubo-result-3': require('../assets/mascot/nubo-result-3.png'),
  'nubo-result-4': require('../assets/mascot/nubo-result-4.png'),
  'nubo-result-5': require('../assets/mascot/nubo-result-5.png'),
  'nubo-result-6': require('../assets/mascot/nubo-result-6.png'),
};

function cacheImages(images: (string | number)[]): Promise<(void | boolean)[]> {
  return Promise.all(
    images.map((image) => {
      if (typeof image === 'string') {
        // It's a remote image, prefetch it
        return Image.prefetch(image);
      } else {
        // It's a local asset, resolve the URI and then prefetch it
        const asset = Asset.fromModule(image);
        return Image.prefetch(asset.uri);
      }
    })
  );
}

// Preloads all assets required by the app
export async function loadAssets() {
  const imageAssets = cacheImages(Object.values(AppImages));

  // You can also preload fonts here
  // const fontAssets = Font.loadAsync({
  //   'Your-Font-Name': require('../assets/fonts/Your-Font-Name.ttf'),
  // });

  await Promise.all([imageAssets]);
}

// Preloads and decodes the most critical images for the home screen to prevent pop-in.
export async function preloadHomeScreenAssets() {
  const assetsToLoad = [
    AppImages.homescreenBackground,
    AppImages.mountain1,
  ];

  try {
    const urisToPrefetch = assetsToLoad.map(asset => Asset.fromModule(asset).uri);
    await Promise.all(urisToPrefetch.map(uri => Image.prefetch(uri)));
  } catch (e) {
    console.warn("Error preloading home screen assets", e);
  }
} 