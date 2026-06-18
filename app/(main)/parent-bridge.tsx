/**
 * app/(main)/parent-bridge.tsx
 * Route wrapper for ParentBridgeScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentBridgeScreen } from '@/screens/ParentBridgeScreen';

export default function ParentBridgeRoute() {
  const {
    theme,
    parentMood,
    selectedSekret,
  } = useAppContext();
  return (
    <ParentBridgeScreen
      theme={theme}
      mood={parentMood}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="parent-room"
    />
  );
}
