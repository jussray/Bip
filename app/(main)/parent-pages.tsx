/**
 * app/(main)/parent-pages.tsx
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentPagesScreen } from '@screens/ParentPagesScreen';

export default function ParentPagesRoute() {
  const { parentMood, parentRoomStyle, parentPagesDraft, setParentPagesDraft, parentPagesEntries, parentOracleProfile, completeParentOracleSession } = useAppContext();
  return (
    <ParentPagesScreen
      mood={parentMood}
      parentRoomStyle={(parentRoomStyle === 'dad' ? 'dad' : 'mom')}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      onSave={() => {}}
      oracleProfile={parentOracleProfile ?? undefined}
      onCompleteOracleSession={completeParentOracleSession}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
