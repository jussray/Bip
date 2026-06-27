import React from 'react';
import { ConnectionHubScreen } from '@screens/ConnectionHubScreen';
import { parentNavigateTo } from '@/parent/navigation';

export default function ParentConnectionRoute() {
  return (
    <ConnectionHubScreen
      setScreen={parentNavigateTo}
      BottomNav={null}
    />
  );
}
