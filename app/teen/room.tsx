import { HomeScreen } from '@screens/HomeScreen';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS, SEKRET_PROFILES } from '@constants/theme';

export default function TeenRoomRoute() {
  const {
    theme, mood, selectMood, userSide,
    selectedSekret, homeMessageIndex, syncStatus,
  } = useAppContext();

  const t             = THEME_PACKS[theme]              ?? THEME_PACKS['neon'];
  const currentSekret = SEKRET_PROFILES[selectedSekret] ?? SEKRET_PROFILES['soft'];

  return (
    <HomeScreen
      mood={mood}
      selectMood={selectMood}
      t={t}
      currentSekret={currentSekret}
      selectedSekret={selectedSekret}
      homeMessageIndex={homeMessageIndex}
      userSide={userSide ?? 'teen'}
      setScreen={teenNavigateTo}
      BottomNav={null}
      syncStatus={syncStatus}
    />
  );
}
