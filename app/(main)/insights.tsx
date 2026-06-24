import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { InsightsScreen } from '@screens/InsightsScreen';
import { routeForSide } from '@/shared/routes';

export default function InsightsRoute() {
  const { mood } = useAppContext();
  return (
    <InsightsScreen
      side="teen"
      mood={mood}
      setScreen={(screen: string) => router.push(routeForSide('teen', screen) as any)}
      BottomNav={null}
    />
  );
}
