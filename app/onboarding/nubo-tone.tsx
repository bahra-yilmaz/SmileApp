import React from 'react';
import NuboToneScreen from '../../components/onboarding/NuboToneScreen';
import { useTranslation } from 'react-i18next';

export default function OnboardingNuboTone() {
  const { t } = useTranslation();
  return (
    <NuboToneScreen
      title={t('onboarding.nuboToneScreen.title')}
      description={t('onboarding.nuboToneScreen.description')}
      nextScreenPath="/(home)"
      index={3}
      totalScreens={4}
      isLastScreen={true}
    />
  );
} 