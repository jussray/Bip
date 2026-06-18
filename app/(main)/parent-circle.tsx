/**
 * app/(main)/parent-circle.tsx
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentCircleScreen } from '@screens/ParentCircleScreen';

export default function ParentCircleRoute() {
  const { parentCirclePosts, parentCirclePostText, setParentCirclePostText, saveParentCirclePost, reactToParentPost } = useAppContext();
  return (
    <ParentCircleScreen
      parentCirclePosts={parentCirclePosts}
      parentCirclePostText={parentCirclePostText}
      setParentCirclePostText={setParentCirclePostText}
      saveParentCirclePost={saveParentCirclePost}
      reactToParentPost={(id: string | number, type: string) => reactToParentPost(Number(id), type)}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      BottomNav={null}
    />
  );
}
