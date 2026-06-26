/**
 * app/(main)/cloud.tsx
 * Route wrapper for CloudThoughtsScreen.
 */
import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { CloudThoughtsScreen } from '@screens/CloudThoughtsScreen';
import { syncVoiceNote } from '@/utils/sync';
import type { VoiceNote } from '@/types/index';

export default function CloudRoute() {
  const {
    theme, mood, selectedSekret, userSide,
    voiceNotes, setVoiceNotes,
    parentVoiceNotes, setParentVoiceNotes,
  } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  const setNotes = userSide === 'parent' ? setParentVoiceNotes : setVoiceNotes;

  const handleSave = useCallback((note: VoiceNote) => {
    setNotes(prev => [note, ...prev]);
    syncVoiceNote(note);
  }, [setNotes]);

  return (
    <CloudThoughtsScreen
      t={t}
      mood={mood}
      selectedSekret={selectedSekret}
      BottomNav={null}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      onSave={handleSave}
    />
  );
}
