/**
 * app/_layout.tsx
 *
 * Root layout.
 * - Wraps the entire app with AppProvider (theme, mood, userSide, breatheAnim,
 *   journal state, mood history, circle posts — all formerly prop-drilled from
 *   app/index.tsx via the setScreen string router).
 * - Analytics, SplashScreen hide, and any future global providers go here.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AppProvider } from '@/context/AppContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
