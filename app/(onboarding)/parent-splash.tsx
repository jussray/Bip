import React, { useEffect, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SplashScreen } from '@screens/SplashScreen';

const ENTRY_LOCK_MS = 900;

export default function ParentOnboardingSplash() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [entryEnabled, setEntryEnabled] = useState(false);
  const destination = next === 'room' ? '/(parent)/room' : '/(onboarding)/parent-welcome';

  useEffect(() => {
    const timer = setTimeout(() => setEntryEnabled(true), ENTRY_LOCK_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SplashScreen
      userSide="parent"
      setScreen={() => {
        if (!entryEnabled) return;
        router.replace(destination);
      }}
    />
  );
}
