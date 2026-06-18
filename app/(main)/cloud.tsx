/**
 * app/(main)/cloud.tsx
 * Route wrapper for CloudThoughtsScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { CloudThoughtsScreen } from '@/screens/CloudThoughtsScreen';

export default function CloudRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  return (
    <CloudThoughtsScreen
      theme={theme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="home"
    />
  );
}
