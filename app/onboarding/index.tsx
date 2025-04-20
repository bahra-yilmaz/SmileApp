import React from 'react';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

export default function OnboardingWelcome() {
  return (
    <OnboardingScreen
      title="Welcome to Smile App"
      description="Your personal companion for dental health and hygiene. We'll help you build and maintain healthy brushing habits to keep your smile bright."
      nextScreenPath="/onboarding/features"
      index={0}
      totalScreens={3}
      hideImage={true}
    />
  );
}