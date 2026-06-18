import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { parentNavigateTo } from '@/parent/navigation';
import { ParentPagesScreen } from '@screens/ParentPagesScreen';

export default function ParentPagesRoute() {
  const {
    parentMood, parentRoomStyle,
    parentPagesDraft, setParentPagesDraft,
    parentPagesEntries, parentOracleProfile,
    completeParentOracleSession, saveParentPageEntry,
  } = useAppContext();

  return (
    <ParentPagesScreen
      mood={parentMood}
      parentRoomStyle={parentRoomStyle === 'dad' ? 'dad' : 'mom'}
      draft={parentPagesDraft}
      setDraft={setParentPagesDraft}
      entries={parentPagesEntries}
      onSave={saveParentPageEntry}
      oracleProfile={parentOracleProfile ?? undefined}
      onCompleteOracleSession={completeParentOracleSession}
      setScreen={parentNavigateTo}
      onOpenPeriodCalendar={() => router.push('/parent/period-calendar' as any)}
      BottomNav={null}
    />
  );
}
