import React from 'react';
import { Redirect } from 'expo-router';

export default function RootScreen() {
  return <Redirect href="/onboarding/language-select" />;
} 