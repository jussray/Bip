import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SplashScreen } from '@screens/SplashScreen';

export default function ParentOnboardingSplash() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const destination = next === 'room' ? '/(parent)/room' : '/(onboarding)/parent-welcome';

  return (
    <SplashScreen
      userSide="parent"
      setScreen={() => router.replace(destination)}
    />
  );
}
