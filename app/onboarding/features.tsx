import React from 'react';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

export default function OnboardingFeatures() {
  return (
    <OnboardingScreen
      title="Powerful Features"
      description="Track your mood, set goals, practice mindfulness, and create healthy habits with our easy-to-use tools."
      imageSource={require('../../assets/images/splash-screen.png')}
      nextScreenPath="/onboarding/personalize"
      index={1}
      totalScreens={3}
    />
  );
}