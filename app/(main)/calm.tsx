/**
 * app/(main)/calm.tsx
 *
 * Calm / breathing tab.
 */
import React, { useState } from 'react';
import { CalmScreen } from '@/screens/CalmScreen';
import { useAppContext } from '@/context/AppContext';
import { navigateTo } from '@/utils/navigation';

export default function CalmTab() {
  const [comfortIdx, setComfortIdx] = useState(0);
  const { theme, userSide, breatheAnim } = useAppContext();

  return (
    <CalmScreen
      theme={theme}
      comfortIdx={comfortIdx}
      setComfortIdx={setComfortIdx}
      setScreen={navigateTo}
      userSide={userSide}
      breatheAnim={breatheAnim}
    />
  );
}
