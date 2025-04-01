import React from 'react';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

export default function OnboardingWelcome() {
  return (
    <OnboardingScreen
      title="Welcome to Smile App"
      description="Your personal companion for happiness and productivity. Start your journey to a better you."
      imageSource={require('../../assets/images/splash-screen.png')}
      nextScreenPath="/onboarding/features"
      index={0}
      totalScreens={3}
    />
  );
}