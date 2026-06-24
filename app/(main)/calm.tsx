/**
 * app/(main)/calm.tsx
 *
 * Calm tab route — bridges Expo Router to CalmScreen.
 *
 * CalmScreen expects:
 *   t               — full theme object (Record<string,any>) from THEME_PACKS
 *   mood            — current mood string
 *   setMood         — mood setter
 *   setScreen       — legacy string-based navigation shim
 *   BottomNav       — null (Expo Router owns the tab bar)
 *   selectedSekret? — personality key string
 *
 * Previously this route was passing: theme (string), comfortIdx,
 * setComfortIdx, userSide, and breatheAnim — none of which exist in
 * CalmScreenProps.  That caused a prop-type mismatch that crashed the tab.
 */
import React from 'react';
import { router } from 'expo-router';
import { CalmScreen } from '@screens/CalmScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS } from '@/constants/theme';

export default function CalmTab() {
  const { theme, mood, setMood, selectedSekret } = useAppContext();

  // Derive the full theme object CalmScreen needs from the string key.
  const t = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  return (
    <CalmScreen
      t={t}
      mood={mood}
      setMood={setMood}
      setScreen={navigateTo}
      BottomNav={null}
      selectedSekret={selectedSekret}
      onOpenBreathe={() => router.push('/(teen)/calm/breathe' as any)}
    />
  );
}
