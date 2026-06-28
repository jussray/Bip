import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ParentBridgeScreen } from '@screens/ParentBridgeScreen';
import { parentNavigateTo } from '@/parent/navigation';
import { useLinkedTeen } from '@/hooks/useLinkedTeen';

export default function ParentBridgeRoute() {
  const { theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const linkedTeen = useLinkedTeen();
  return (
    <ParentBridgeScreen
      t={t}
      BottomNav={null}
      setScreen={parentNavigateTo}
      linkedTeen={linkedTeen}
    />
  );
}
