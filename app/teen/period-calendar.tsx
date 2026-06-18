import React, { useEffect, useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { teenNavigateTo } from '@/teen/navigation';
import { THEME_PACKS } from '@constants/theme';
import { PeriodCalendarScreen } from '@screens/PeriodCalendarScreen';
import { syncPeriodDay, deletePeriodDay, loadPeriodDays } from '@/utils/sync';

export default function TeenPeriodCalendarRoute() {
  const { theme, mood, selectedSekret } = useAppContext();
  const currentTheme = THEME_PACKS[theme] ?? THEME_PACKS['neon'];
  const [markedDays, setMarkedDays] = useState<string[]>([]);

  useEffect(() => {
    loadPeriodDays().then(days => {
      if (days.length > 0) setMarkedDays(days);
    });
  }, []);

  return (
    <PeriodCalendarScreen
      theme={currentTheme}
      mood={mood}
      selectedSekret={selectedSekret}
      setScreen={teenNavigateTo}
      BottomNav={null}
      backTarget="bips"
    />
  );
}
