import { router } from 'expo-router';
import { UserRoomScreen } from '@screens/UserRoomScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';

const ROOM_VIBES = ['rylane', 'cloud', 'night', 'rain', 'sunset'] as const;

type RoomVibe = (typeof ROOM_VIBES)[number];

function resolveRoomVibe(theme: string): RoomVibe | 'raylene' {
  return ROOM_VIBES.includes(theme as RoomVibe) ? (theme as RoomVibe) : 'raylene';
}

function resolveCompanionKey(selectedSekret: string | null | undefined): string {
  return selectedSekret === 'soft' || !selectedSekret ? 'raylene' : selectedSekret;
}

export default function TeenRoomRoute() {
  const { mood, selectedSekret, setSelectedSekret, theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.raylene;
  const vibe = resolveRoomVibe(theme);
  const companionKey = resolveCompanionKey(selectedSekret);

  const handleScreen = (screen: string) => {
    if (screen === 'sekret') {
      router.push({
        pathname: '/(teen)/companion-chat',
        params: { companion: companionKey, surface: 'home' },
      } as any);
      return;
    }

    router.push(routeForSide('teen', screen) as any);
  };

  return (
    <UserRoomScreen
      mood={mood}
      selectedSekret={selectedSekret}
      setSelectedSekret={setSelectedSekret}
      setScreen={handleScreen}
      t={t}
      vibe={vibe}
      BottomNav={null}
      sekretMode={selectedSekret}
    />
  );
}
