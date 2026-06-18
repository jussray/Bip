/**
 * app/(main)/parent-bridge.tsx
 * Route wrapper for ParentBridgeScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ParentBridgeScreen } from '@screens/ParentBridgeScreen';

export default function ParentBridgeRoute() {
  const { theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <ParentBridgeScreen
      t={t}
      BottomNav={null}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
    />
  );
}
