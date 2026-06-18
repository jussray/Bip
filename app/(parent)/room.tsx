import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentRoomScreen } from '@screens/ParentRoomScreen';
import { routeForSide } from '@/shared/routes';

export default function ParentRoomRoute() {
  const { parentMood, parentMoodDate, setParentMood, parentRoomStyle } = useAppContext();
  return (
    <ParentRoomScreen
      parentRoomStyle={(parentRoomStyle === 'dad' ? 'dad' : 'mom')}
      parentMood={parentMood}
      previousMood={parentMoodDate || undefined}
      setParentMood={setParentMood}
      setScreen={(screen: string) => router.push(routeForSide('parent', screen) as any)}
      BottomNav={null}
    />
  );
}
