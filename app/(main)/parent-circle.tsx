/**
 * app/(main)/parent-circle.tsx
 * Route wrapper for ParentCircleScreen.
 */
import React from 'react';
import { router } from 'expo-router';
import { useAppContext } from '@/context/AppContext';
import { ParentCircleScreen } from '@/screens/ParentCircleScreen';

export default function ParentCircleRoute() {
  const {
    theme,
    parentMood,
    parentCirclePosts,
    parentCirclePostText,
    setParentCirclePostText,
    saveParentCirclePost,
    reactToParentPost,
    selectedSekret,
  } = useAppContext();
  return (
    <ParentCircleScreen
      theme={theme}
      mood={parentMood}
      posts={parentCirclePosts}
      postText={parentCirclePostText}
      setPostText={setParentCirclePostText}
      savePost={saveParentCirclePost}
      reactToPost={reactToParentPost}
      selectedSekret={selectedSekret}
      setScreen={(screen: string) => router.push(`/(main)/${screen}` as any)}
      backTarget="parent-room"
    />
  );
}
