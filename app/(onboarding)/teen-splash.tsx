import React from 'react';
import { router } from 'expo-router';
import { SplashScreen } from '@screens/SplashScreen';

export default function TeenOnboardingSplash() {
  return (
    <SplashScreen
      userSide="teen"
      setScreen={() => router.replace('/(onboarding)/welcome')}
    />
  );
}
