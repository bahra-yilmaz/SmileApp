import React from 'react';
import BrushingGoalScreen from '../../components/onboarding/BrushingGoalScreen';
import { useTranslation } from 'react-i18next';

export default function OnboardingBrushingGoal() {
  const { t } = useTranslation();
  return (
    <BrushingGoalScreen
      title={t('onboarding.brushingGoalScreen.title')}
      description={t('onboarding.brushingGoalScreen.description')}
      nextScreenPath="/onboarding/toothbrush"
      index={1}
      totalScreens={4}
      isLastScreen={false}
    />
  );
}