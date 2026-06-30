import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { THEME_PACKS } from '@constants/theme';
import { ParentBridgeScreen } from '@screens/ParentBridgeScreen';
import { parentNavigateTo } from '@/parent/navigation';
import { useLinkedBridge } from '@/hooks/useLinkedBridge';

export default function ParentBridgeRoute() {
  const { theme } = useAppContext();
  const t = THEME_PACKS[theme] ?? THEME_PACKS.neon;
  const linkedTeen = useLinkedBridge();
  return (
    <ParentBridgeScreen
      t={t}
      BottomNav={null}
      setScreen={parentNavigateTo}
      linkedTeen={linkedTeen}
    />
  );
}
