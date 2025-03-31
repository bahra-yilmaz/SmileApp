import React from 'react';
import OnboardingScreen from '../../components/onboarding/OnboardingScreen';

export default function OnboardingPersonalize() {
  return (
    <OnboardingScreen
      title="Made For You"
      description="Your app experience adapts to your needs. Customize colors, themes, and notifications to make Smile uniquely yours."
      imageSource={require('../../assets/images/splash-logo.png')}
      nextScreenPath="/(home)"
      index={2}
      totalScreens={3}
      isLastScreen={true}
    />
  );
} 