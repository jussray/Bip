/**
 * app/(main)/voicebip.tsx
 *
 * Voice Bip route. Voice notes are lifted into AppContext so they survive
 * navigation — teen side uses voiceNotes/setVoiceNotes, parent side uses
 * parentVoiceNotes/setParentVoiceNotes.
 */
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS } from '@constants/theme';
import { VoiceBipScreen } from '@screens/VoiceBipScreen';
import type { VoiceNote } from '@/types';
import { syncVoiceNote } from '@/utils/sync';

export default function VoiceBipRoute() {
  const {
    theme,
    mood,
    selectedSekret,
    setSelectedSekret,
    userSide,
    voiceNotes,
    setVoiceNotes,
    parentVoiceNotes,
    setParentVoiceNotes,
  } = useAppContext();

  const isParent = userSide === 'parent';
  const notes = isParent ? parentVoiceNotes : voiceNotes;
  const setNotes = isParent ? setParentVoiceNotes : setVoiceNotes;

  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  return (
    <VoiceBipScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      onSelectAvatar={setSelectedSekret}
      voiceNotes={notes}
      setVoiceNotes={setNotes}
      setScreen={(screen: string) => navigateTo(screen, userSide ?? 'teen')}
      BottomNav={null}
      onSave={(note: VoiceNote) => {
        setNotes(prev => [note, ...prev]);
        syncVoiceNote(note);
      }}
    />
  );
}
