import React from 'react';
import ToothbrushDurationScreen from '../../components/onboarding/ToothbrushDurationScreen';
import { useTranslation } from 'react-i18next';

export default function OnboardingToothbrushDuration() {
  const { t } = useTranslation();
  return (
    <ToothbrushDurationScreen
      title={t('onboarding.toothbrushDurationScreen.title')}
      description={t('onboarding.toothbrushDurationScreen.description')}
      nextScreenPath="/onboarding/nubo-tone"
      index={2}
      totalScreens={4}
      isLastScreen={false}
    />
  );
} 