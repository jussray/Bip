import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { Analytics } from '@/components/shared/Analytics';
import { AppProvider, useAppContext } from '@/context/AppContext';
import { validateEnv } from '@/utils/env';

void validateEnv();

function RouteBoundary() {
  const { userSide, isLoading } = useAppContext();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading || !userSide) return;
    const area = String(segments[0] ?? '');
    if (userSide === 'teen' && (area === '(parent)' || area === 'parent')) {
      router.replace('/(teen)/room');
    }
    if (userSide === 'parent' && (area === '(teen)' || area === 'teen')) {
      router.replace('/(parent)/room');
    }
  }, [isLoading, segments, userSide]);

  return null;
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RouteBoundary />
      <Analytics />
      <Stack screenOptions={{ headerShown: false }} />
    </AppProvider>
  );
}
