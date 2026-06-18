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
  } = useAppContext();

  return (
    <ParentPagesScreen
      mood={parentMood}
      parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      onSave={() => {}}
      oracleProfile={parentOracleProfile ?? undefined}
      onCompleteOracleSession={completeParentOracleSession}
      setScreen={navigateTo}
      BottomNav={null}
    />
  );
}
