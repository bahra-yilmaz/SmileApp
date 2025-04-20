import React from 'react';
import NuboToneScreen from '../../components/onboarding/NuboToneScreen';

export default function OnboardingNuboTone() {
  return (
    <NuboToneScreen
      title="Nubo's Tone"
      description="Choose how Nubo will interact with you"
      nextScreenPath="/(home)"
      index={3}
      totalScreens={4}
      isLastScreen={true}
    />
  );
} 