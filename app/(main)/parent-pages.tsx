/**
 * app/(main)/parent-pages.tsx
 * Route wrapper for ParentPagesScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentPagesScreen } from '@/screens/ParentPagesScreen';

export default function ParentPagesRoute() {
  const {
    theme,
    parentMood,
    parentPagesDraft,
    setParentPagesDraft,
    parentPagesEntries,
    saveParentPageEntry,
    selectedSekret,
  } = useAppContext();
  return (
    <ParentPagesScreen
      theme={theme}
      mood={parentMood}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      saveEntry={saveParentPageEntry}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="parent-room"
    />
  );
}
