/**
 * app/(main)/parent-pages.tsx
 */
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { ParentPagesScreen } from '@screens/ParentPagesScreen';

export default function ParentPagesRoute() {
  const {
    parentMood,
    parentRoomStyle,
    parentPagesDraft,
    setParentPagesDraft,
    parentPagesEntries,
    parentOracleProfile,
    completeParentOracleSession,
    saveParentPageEntry,
  } = useAppContext();

  return (
    <ParentPagesScreen
      mood={parentMood}
      parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      onSave={saveParentPageEntry}
      oracleProfile={(parentOracleProfile ?? undefined) as any}
      onCompleteOracleSession={completeParentOracleSession}
      setScreen={navigateTo}
      BottomNav={null}
    />
  );
}
