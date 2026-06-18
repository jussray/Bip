/**
 * app/(main)/points.tsx
 * Route wrapper for PointsScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { PointsScreen } from '@/screens/PointsScreen';

export default function PointsRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <PointsScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="home"
    />
  );
}
