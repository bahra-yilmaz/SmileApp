import React from 'react';
import BrushingGoalScreen from '../../components/onboarding/BrushingGoalScreen';

export default function OnboardingBrushingGoal() {
  return (
    <BrushingGoalScreen
      title="Set Your Brushing Goal"
      description="How many times per day do you want to brush your teeth? Dentists recommend at least twice daily."
      nextScreenPath="/onboarding/toothbrush"
      index={1}
      totalScreens={4}
      isLastScreen={false}
    />
  );
}