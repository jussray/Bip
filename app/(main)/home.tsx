/**
 * app/(main)/home.tsx
 *
 * Home tab — renders the real HomeScreen component.
 * State is read from AppContext; theme object + sekret profile are derived
 * here so HomeScreen receives the exact props its interface expects.
 */
import HomeScreen from '@/screens/HomeScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS, SEKRET_PROFILES } from '@/constants/theme';

export default function HomeTab() {
  const {
    theme,
    mood,
    selectMood,
    userSide,
    selectedSekret,
    homeMessageIndex,
    syncStatus,
  } = useAppContext();

  // Derive the objects HomeScreen expects from the string keys stored in context
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
      setScreen={navigateTo}
      BottomNav={null}
      syncStatus={syncStatus}
    />
  );
}
