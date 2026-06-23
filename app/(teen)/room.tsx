import React, { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import { RoomScreen } from '@screens/RoomScreen';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@/constants/theme';
import { routeForSide } from '@/shared/routes';
import { loadSekretMemory } from '../../services/sekretMemory';

export default function TeenRoomRoute() {
  const { mood, selectedSekret, setSelectedSekret, theme, entries, moodHistory } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;

  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    loadSekretMemory().then(mem => setStreakDays(mem.streaks.current));
  }, []);

  const lastActivity = useMemo(() => {
    const lastEntry = entries?.[entries.length - 1];
    if (lastEntry?.text?.trim()) {
      const text = lastEntry.text.trim();
      return {
        label: 'Continue your last page',
        snippet: text.slice(0, 65) + (text.length > 65 ? '…' : ''),
        route: 'pages',
      };
    }
    if (streakDays >= 2) {
      return {
        label: `${streakDays}-day streak — keep it going`,
        route: 'pages',
      };
    }
    const lastMood = moodHistory?.[moodHistory.length - 1];
    if (lastMood?.mood) {
      return {
        label: `You checked in feeling ${lastMood.mood}`,
        route: 'pages',
      };
    }
    return null;
  }, [entries, moodHistory, streakDays]);

  const companionKey = selectedSekret === 'soft' ? 'raylene' : selectedSekret;

  const handleTalkToSekret = () => {
    router.push({
      pathname: '/(teen)/companion-chat',
      params: { companion: companionKey, surface: 'home' },
    } as any);
  };

  const vibe =
    theme === 'rylane' || theme === 'cloud' || theme === 'night' ||
    theme === 'rain'   || theme === 'sunset'
      ? theme
      : 'raylene';

  return (
    <RoomScreen
      mood={mood}
      selectedSekret={selectedSekret}
      setSelectedSekret={setSelectedSekret}
      setScreen={(screen: string) => router.push(routeForSide('teen', screen) as any)}
      t={t}
      vibe={vibe}
      BottomNav={null}
      sekretMode={selectedSekret}
      onTalkToSekret={handleTalkToSekret}
      lastActivity={lastActivity}
    />
  );
}
