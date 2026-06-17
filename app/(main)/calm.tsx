/**
 * app/(main)/calm.tsx
 *
 * Calm / breathing tab.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { CalmScreen } from '@screens/CalmScreen';
import { useAppContext } from '@/context/AppContext';

const SCREEN_MAP: Record<string, string> = {
  home:  '/(main)/home',
  pages: '/(main)/pages',
  calm:  '/(main)/calm',
};

function setScreen(screen: string) {
  router.push((SCREEN_MAP[screen] ?? '/(main)/home') as any);
}

export default function CalmTab() {
  const [comfortIdx, setComfortIdx] = useState(0);
  const { theme, userSide, breatheAnim } = useAppContext();

  return (
    <CalmScreen
      theme={theme}
      comfortIdx={comfortIdx}
      setComfortIdx={setComfortIdx}
      setScreen={setScreen}
      userSide={userSide}
      breatheAnim={breatheAnim}
    />
  );
}
