import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';
import { VoiceBipScreen } from '@screens/VoiceBipScreen';
import type { VoiceNote } from '@/types';
import { syncVoiceNote } from '@/utils/sync';

export default function TeenVoiceBipRoute() {
  const { theme, mood, selectedSekret, voiceNotes, setVoiceNotes } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  return (
    <VoiceBipScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      voiceNotes={voiceNotes}
      setVoiceNotes={setVoiceNotes}
      setScreen={teenNavigateTo}
      BottomNav={null}
      onSave={(note: VoiceNote) => {
        setVoiceNotes((prev: VoiceNote[]) => [note, ...prev]);
        syncVoiceNote(note);
      }}
    />
  );
}
