import { router } from 'expo-router';
import { RoomScreen } from '@screens/RoomScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';

export default function TeenRoomRoute() {
  const { mood, selectedSekret, setSelectedSekret, theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <RoomScreen
      mood={mood}
      selectedSekret={selectedSekret}
      setSelectedSekret={setSelectedSekret}
      setScreen={(screen: string) => router.push(routeForSide('teen', screen) as any)}
      t={t}
      vibe={(theme === 'rylane' || theme === 'cloud' || theme === 'night' || theme === 'rain' || theme === 'sunset') ? theme : 'raylene'}
      BottomNav={null}
      sekretMode={selectedSekret}
    />
  );
}
