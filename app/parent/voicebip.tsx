import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import { THEME_PACKS } from '@constants/theme';
import { VoiceBipScreen } from '@screens/VoiceBipScreen';
import type { VoiceNote } from '@/types';
import { syncVoiceNote } from '@/utils/sync';

export default function ParentVoiceBipRoute() {
  const { theme, mood, selectedSekret, parentVoiceNotes, setParentVoiceNotes } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <VoiceBipScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      voiceNotes={parentVoiceNotes}
      setVoiceNotes={setParentVoiceNotes}
      setScreen={parentNavigateTo}
      BottomNav={null}
      onSave={(note: VoiceNote) => {
        setParentVoiceNotes((prev: VoiceNote[]) => [note, ...prev]);
        syncVoiceNote(note);
      }}
    />
  );
}
