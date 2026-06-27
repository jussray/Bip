import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ParentBridgeScreen } from '@screens/ParentBridgeScreen';
import { parentNavigateTo } from '@/parent/navigation';

export default function ParentBridgeRoute() {
  const { theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  return (
    <ParentBridgeScreen
      t={t}
      BottomNav={null}
      setScreen={parentNavigateTo}
    />
  );
}
