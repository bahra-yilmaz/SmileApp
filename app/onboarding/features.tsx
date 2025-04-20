import React from 'react';
import AgeSelectionScreen from '../../components/onboarding/AgeSelectionScreen';

export default function OnboardingAgeSelection() {
  return (
    <AgeSelectionScreen
      title="What is your age?"
      description="This helps us filter out workouts for you"
      nextScreenPath="/onboarding/personalize"
      index={0}
      totalScreens={4}
    />
  );
}