import React from 'react';
import ToothbrushDurationScreen from '../../components/onboarding/ToothbrushDurationScreen';

export default function OnboardingToothbrushDuration() {
  return (
    <ToothbrushDurationScreen
      title="Toothbrush Duration"
      description="When did you last change your toothbrush?"
      nextScreenPath="/onboarding/nubo-tone"
      index={2}
      totalScreens={4}
      isLastScreen={false}
    />
  );
} 