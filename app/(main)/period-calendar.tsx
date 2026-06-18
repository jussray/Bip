/**
 * app/(main)/period-calendar.tsx
 *
 * Wires PeriodCalendarScreen to the sync layer:
 *   - loadPeriodDays  on mount (pull from cloud)
 *   - syncPeriodDay   when a day is marked
 *   - deletePeriodDay when a day is un-marked
 * Navigation uses navigateTo() instead of raw router.push.
 */
import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';
import { THEME_PACKS } from '@constants/theme';
import { PeriodCalendarScreen } from '@screens/PeriodCalendarScreen';
import { syncPeriodDay, deletePeriodDay, loadPeriodDays } from '@/utils/sync';

export default function PeriodCalendarRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];

  const [markedDays, setMarkedDays] = useState<string[]>([]);

  // Pull marked days from cloud on mount
  useEffect(() => {
    loadPeriodDays().then(days => {
      if (days.length > 0) setMarkedDays(days);
    });
  }, []);

  function handleMarkDay(day: string) {
    setMarkedDays(prev => prev.includes(day) ? prev : [...prev, day]);
    void syncPeriodDay(day);
  }

  function handleUnmarkDay(day: string) {
    setMarkedDays(prev => prev.filter(d => d !== day));
    void deletePeriodDay(day);
  }

  return (
    <PeriodCalendarScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={navigateTo}
      BottomNav={null}
      backTarget="sekret"
      markedDays={markedDays}
      onMarkDay={handleMarkDay}
      onUnmarkDay={handleUnmarkDay}
    />
  );
}
