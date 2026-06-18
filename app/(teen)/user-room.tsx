import { router } from 'expo-router';
import { UserRoomScreen } from '@screens/UserRoomScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';

export default function TeenUserRoomRoute() {
  const { mood, selectedSekret, setSelectedSekret, theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.raylene;
  return (
    <UserRoomScreen
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
