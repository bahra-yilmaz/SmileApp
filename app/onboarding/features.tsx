import React from 'react';
import AgeSelectionScreen from '../../components/onboarding/AgeSelectionScreen';
import { useTranslation } from 'react-i18next';

export default function OnboardingAgeSelection() {
  const { t } = useTranslation();
  return (
    <AgeSelectionScreen
      title={t('onboarding.ageSelectionScreen.title')}
      description={t('onboarding.ageSelectionScreen.description')}
      nextScreenPath="/onboarding/personalize"
      index={0}
      totalScreens={4}
    />
  );
}