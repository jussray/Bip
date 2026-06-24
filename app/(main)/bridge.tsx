/**
 * app/(main)/bridge.tsx
 *
 * Teen-side Bridge route — bridges Expo Router to BridgeScreen.
 *
 * Privacy design (enforced in BridgeScreen):
 *   - Teen message text is NEVER sent to Supabase (local-first privacy).
 *   - Only a bridge_signal row is inserted (share_type, char_key, sent_at).
 *   - Parent warm notes (parent_notes) are fetched and displayed because
 *     the parent is the author — it's not the teen's private diary.
 *   - Realtime subscription keeps parent notes live across sessions.
 */
import React from 'react';
import { router } from 'expo-router';
import { BridgeScreen } from '@screens/BridgeScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS, SEKRET_PROFILES } from '@/constants/theme';

export default function BridgeRoute() {
  const { theme, mood, selectedSekret } = useAppContext();

  const t            = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  const currentSekret = SEKRET_PROFILES[selectedSekret ?? 'rylane'] ?? SEKRET_PROFILES['rylane'] ?? {};

  return (
    <BridgeScreen
      t={t}
      currentSekret={currentSekret}
      setScreen={(screen: string) => navigateTo(screen, 'teen')}
      BottomNav={null}
      selectedSekret={selectedSekret}
      mood={mood}
    />
  );
}
